const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files (HTML, CSS, JS, images) from the project root
app.use(express.static(__dirname));

// Endpoint to download any file from the project (safe limited to known directories)
app.get('/download/:file', (req, res) => {
  // Allow only files inside the project root (prevent path traversal)
  const safeFile = path.basename(req.params.file);
  const filePath = path.join(__dirname, safeFile);
  if (fs.existsSync(filePath)) {
    res.download(filePath, safeFile, err => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Simple health‑check endpoint (useful for deployment monitors)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Catch‑all for unknown routes – return 404 JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.listen(PORT, () => {
  console.log(`Media Player server running at http://localhost:${PORT}`);
});
