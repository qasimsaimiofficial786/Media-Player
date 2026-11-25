package app.mediaplayer.pro;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.database.ContentObserver;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Size;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Finds every song and video on the device through MediaStore and plays them in the web view
 * through a tiny server that only listens on 127.0.0.1 and needs a random token.
 */
@CapacitorPlugin(
    name = "MediaLibrary",
    permissions = {
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "video", strings = { Manifest.permission.READ_MEDIA_VIDEO }),
        @Permission(alias = "legacy", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MediaLibraryPlugin extends Plugin {

    private static final Pattern ROUTE = Pattern.compile("^/([A-Za-z0-9]{32})/(m|t)/(audio|video)/(\\d{1,12})$");
    private final ExecutorService pool = Executors.newFixedThreadPool(6);
    private final Handler main = new Handler(Looper.getMainLooper());
    private ServerSocket server;
    private String token;
    private int port;
    private Runnable pending;

    // ---------- permissions ----------
    private String[] aliases() {
        return Build.VERSION.SDK_INT >= 33 ? new String[] { "audio", "video" } : new String[] { "legacy" };
    }

    private boolean granted() {
        for (String a : aliases()) if (getPermissionState(a) != PermissionState.GRANTED) return false;
        return true;
    }

    @PluginMethod
    public void checkAccess(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (granted()) {
            checkAccess(call);
            return;
        }
        requestPermissionForAliases(aliases(), call, "accessResult");
    }

    @PermissionCallback
    private void accessResult(PluginCall call) {
        checkAccess(call);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    // ---------- scan ----------
    @PluginMethod
    public void scan(PluginCall call) {
        if (!granted()) {
            call.reject("No permission");
            return;
        }
        pool.execute(() -> {
            try {
                startServer();
                JSArray items = new JSArray();
                query(items, true);
                query(items, false);
                JSObject r = new JSObject();
                r.put("ok", true);
                r.put("complete", true);
                r.put("port", port);
                r.put("token", token);
                r.put("items", items);
                call.resolve(r);
            } catch (Exception e) {
                call.reject("Scan failed");
            }
        });
    }

    private Uri collection(boolean audio) {
        if (Build.VERSION.SDK_INT >= 29) {
            return audio ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
                         : MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL);
        }
        return audio ? MediaStore.Audio.Media.EXTERNAL_CONTENT_URI : MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
    }

    private void query(JSArray out, boolean audio) throws Exception {
        String[] proj;
        String where = null;
        if (audio) {
            proj = new String[] { MediaStore.Audio.Media._ID, MediaStore.Audio.Media.DISPLAY_NAME, MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST, MediaStore.Audio.Media.ALBUM, MediaStore.Audio.Media.DURATION, MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.DATE_ADDED, MediaStore.Audio.Media.MIME_TYPE, MediaStore.Audio.Media.TRACK, relCol() };
            where = MediaStore.Audio.Media.IS_RINGTONE + "=0 AND " + MediaStore.Audio.Media.IS_NOTIFICATION + "=0 AND "
                + MediaStore.Audio.Media.IS_ALARM + "=0";
        } else {
            proj = new String[] { MediaStore.Video.Media._ID, MediaStore.Video.Media.DISPLAY_NAME, MediaStore.Video.Media.TITLE,
                MediaStore.Video.Media.ARTIST, MediaStore.Video.Media.ALBUM, MediaStore.Video.Media.DURATION, MediaStore.Video.Media.SIZE,
                MediaStore.Video.Media.DATE_ADDED, MediaStore.Video.Media.MIME_TYPE, MediaStore.Video.Media._ID, relCol() };
        }
        ContentResolver cr = getContext().getContentResolver();
        try (Cursor c = cr.query(collection(audio), proj, where, null, null)) {
            if (c == null) return;
            while (c.moveToNext()) {
                JSObject o = new JSObject();
                o.put("nid", c.getLong(0));
                o.put("kind", audio ? "audio" : "video");
                o.put("name", c.getString(1));
                o.put("title", c.getString(2));
                String artist = c.getString(3);
                if (artist != null && !"<unknown>".equals(artist)) o.put("artist", artist);
                String album = c.getString(4);
                if (album != null && !"<unknown>".equals(album)) o.put("album", album);
                o.put("dur", c.getLong(5) / 1000.0);
                o.put("size", c.getLong(6));
                o.put("added", c.getLong(7) * 1000L);
                o.put("mime", c.getString(8));
                if (audio) o.put("track", c.getInt(9) % 1000);
                String rel = c.getString(10);
                if (rel != null) {
                    rel = rel.replace('\\', '/');
                    if (Build.VERSION.SDK_INT < 29) rel = parentOf(rel);
                    while (rel.endsWith("/")) rel = rel.substring(0, rel.length() - 1);
                    o.put("dir", rel.length() == 0 ? "Device" : rel);
                }
                out.put(o);
            }
        }
    }

    private String relCol() {
        return Build.VERSION.SDK_INT >= 29 ? MediaStore.MediaColumns.RELATIVE_PATH : MediaStore.MediaColumns.DATA;
    }

    private String parentOf(String path) {
        int i = path.lastIndexOf('/');
        String p = i > 0 ? path.substring(0, i) : path;
        return p.replaceFirst("^/storage/emulated/0/", "").replaceFirst("^/storage/", "");
    }

    // ---------- change events ----------
    @Override
    public void load() {
        ContentObserver obs = new ContentObserver(main) {
            @Override
            public void onChange(boolean selfChange) {
                if (pending != null) main.removeCallbacks(pending);
                pending = () -> notifyListeners("libraryChanged", new JSObject());
                main.postDelayed(pending, 1500);
            }
        };
        ContentResolver cr = getContext().getContentResolver();
        cr.registerContentObserver(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, true, obs);
        cr.registerContentObserver(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, true, obs);
    }

    @Override
    protected void handleOnDestroy() {
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        pool.shutdownNow();
    }

    // ---------- local streaming server (127.0.0.1 only, random token, Range support) ----------
    private synchronized void startServer() throws Exception {
        if (server != null && !server.isClosed()) return;
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(String.format(Locale.US, "%02x", x));
        token = sb.toString();
        server = new ServerSocket(0, 16, InetAddress.getByName("127.0.0.1"));
        port = server.getLocalPort();
        Thread t = new Thread(() -> {
            while (!server.isClosed()) {
                try {
                    final Socket s = server.accept();
                    s.setSoTimeout(15000);
                    pool.execute(() -> handle(s));
                } catch (Exception e) {
                    break;
                }
            }
        }, "mp-media-server");
        t.setDaemon(true);
        t.start();
    }

    private static String readLine(InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') sb.append((char) c);
            if (sb.length() > 2048) throw new Exception("long");
        }
        return sb.toString();
    }

    private void respond(OutputStream o, int code, String text, String extra) throws Exception {
        String h = "HTTP/1.1 " + code + " " + text + "\r\n" + extra + "Content-Length: 0\r\nConnection: close\r\n\r\n";
        o.write(h.getBytes(StandardCharsets.ISO_8859_1));
    }

    private void handle(Socket s) {
        try (Socket sock = s) {
            InputStream in = sock.getInputStream();
            OutputStream out = sock.getOutputStream();
            String line = readLine(in);
            String[] p = line.split(" ");
            if (p.length < 2) return;
            String method = p[0], path = p[1];
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            String range = null, host = null;
            for (int i = 0; i < 40; i++) {
                String h = readLine(in);
                if (h.isEmpty()) break;
                String low = h.toLowerCase(Locale.US);
                if (low.startsWith("range:")) range = h.substring(6).trim();
                else if (low.startsWith("host:")) host = h.substring(5).trim();
            }
            String cors = "Access-Control-Allow-Origin: https://localhost\r\nAccess-Control-Allow-Headers: range\r\nVary: Origin\r\n";
            if (host == null || !host.equals("127.0.0.1:" + port)) { respond(out, 403, "Forbidden", ""); return; } // blocks DNS rebinding
            if (method.equals("OPTIONS")) { respond(out, 204, "No Content", cors); return; }
            if (!method.equals("GET") && !method.equals("HEAD")) { respond(out, 405, "Method Not Allowed", ""); return; }
            Matcher m = ROUTE.matcher(path);
            if (!m.matches() || !m.group(1).equals(token)) { respond(out, 404, "Not Found", cors); return; }
            boolean audio = m.group(3).equals("audio");
            Uri uri = ContentUris.withAppendedId(collection(audio), Long.parseLong(m.group(4)));
            ContentResolver cr = getContext().getContentResolver();
            if (m.group(2).equals("t")) { thumb(cr, uri, out, cors, method); return; }
            try (ParcelFileDescriptor pfd = cr.openFileDescriptor(uri, "r")) {
                if (pfd == null) { respond(out, 404, "Not Found", cors); return; }
                long size = pfd.getStatSize();
                long start = 0, end = size - 1;
                int code = 200;
                if (range != null) {
                    Matcher r = Pattern.compile("^bytes=(\\d*)-(\\d*)$").matcher(range);
                    if (r.matches()) {
                        if (r.group(1).length() > 0) {
                            start = Long.parseLong(r.group(1));
                            if (r.group(2).length() > 0) end = Math.min(end, Long.parseLong(r.group(2)));
                        } else if (r.group(2).length() > 0) {
                            start = Math.max(0, size - Long.parseLong(r.group(2)));
                        }
                        if (start > end || start >= size) { respond(out, 416, "Range Not Satisfiable", "Content-Range: bytes */" + size + "\r\n" + cors); return; }
                        code = 206;
                    }
                }
                String type = mime(cr, uri, audio);
                StringBuilder h = new StringBuilder("HTTP/1.1 " + code + (code == 206 ? " Partial Content" : " OK") + "\r\n");
                h.append("Content-Type: ").append(type).append("\r\nAccept-Ranges: bytes\r\nContent-Length: ").append(end - start + 1).append("\r\n");
                if (code == 206) h.append("Content-Range: bytes ").append(start).append('-').append(end).append('/').append(size).append("\r\n");
                h.append(cors).append("X-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n");
                out.write(h.toString().getBytes(StandardCharsets.ISO_8859_1));
                if (method.equals("HEAD")) return;
                try (FileInputStream fis = new FileInputStream(pfd.getFileDescriptor())) {
                    fis.getChannel().position(start);
                    byte[] buf = new byte[64 * 1024];
                    long left = end - start + 1;
                    while (left > 0) {
                        int n = fis.read(buf, 0, (int) Math.min(buf.length, left));
                        if (n < 0) break;
                        out.write(buf, 0, n);
                        left -= n;
                    }
                }
            }
        } catch (Exception ignored) {
        }
    }

    private String mime(ContentResolver cr, Uri uri, boolean audio) {
        String t = cr.getType(uri);
        if (t != null && t.matches("^(audio|video)/[A-Za-z0-9.+-]+$")) return t;
        return audio ? "audio/mpeg" : "video/mp4";
    }

    private void thumb(ContentResolver cr, Uri uri, OutputStream out, String cors, String method) throws Exception {
        if (Build.VERSION.SDK_INT < 29) { respond(out, 404, "Not Found", cors); return; }
        try {
            Bitmap bmp = cr.loadThumbnail(uri, new Size(320, 320), null);
            ByteArrayOutputStream bo = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.JPEG, 82, bo);
            byte[] d = bo.toByteArray();
            String h = "HTTP/1.1 200 OK\r\nContent-Type: image/jpeg\r\nContent-Length: " + d.length + "\r\n" + cors + "Connection: close\r\n\r\n";
            out.write(h.getBytes(StandardCharsets.ISO_8859_1));
            if (!method.equals("HEAD")) out.write(d);
        } catch (Exception e) {
            respond(out, 404, "Not Found", cors);
        }
    }
}
