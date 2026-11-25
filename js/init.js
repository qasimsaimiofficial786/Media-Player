(function(){
/* JSON.parse never produces a "__proto__" key (blocks prototype pollution through backups, imports and relay messages) */
try{const _jp=JSON.parse;JSON.parse=function(t,r){return _jp.call(JSON,t,function(k,v){if(k==='__proto__')return undefined;return r?r.call(this,k,v):v})}}catch(e){}
/* Trusted Types: every string that reaches innerHTML and similar sinks passes through this filter when the page's policy enforces it */
try{if(window.trustedTypes&&trustedTypes.createPolicy){
const DROP=new Set(['script','iframe','frame','frameset','object','embed','applet','link','meta','base','noscript','noembed','noframes','xmp','plaintext','template','math','foreignobject','portal']);
const URLA=new Set(['href','src','xlink:href','action','formaction','poster','background','data','srcset','ping','cite']);
const FAST=/\<\s*(script|iframe|frame|frameset|object|embed|applet|link|meta|base|noscript|noembed|noframes|xmp|plaintext|template|math|foreignobject|portal)\b|[\s\/'\"]on[a-z]+\s*=|javascript\s*:|vbscript\s*:|srcdoc|formaction|\<\!--|data\s*:\s*(text|application)/i;
const BAD_URL=/^(javascript|vbscript|data:(text|application))/i;
const int=trustedTypes.createPolicy('mp-int',{createHTML:s=>s});
const san=s=>{const t=document.createElement('template');t.innerHTML=int.createHTML(s);let n=0;
const walk=p=>{for(const c of Array.from(p.childNodes)){
if(c.nodeType===8){c.remove();n++;continue}
if(c.nodeType!==1)continue;const tag=c.localName;if(DROP.has(tag)){c.remove();n++;continue}
for(const a of Array.from(c.attributes)){
const nm=a.name.toLowerCase();if(nm.startsWith('on')||nm==='srcdoc'||(URLA.has(nm)&&BAD_URL.test(a.value.replace(/[\u0000- \u007F\u202a-\u202e\u2066-\u2069]/g,'')))){c.removeAttribute(a.name);n++}}
walk(c)}};walk(t.content);if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML};
walk(t.content);
if(n){try{window.__ttBlocked=(window.__ttBlocked||0)+n;window.r31Sec&&window.r31Sec('bad_input','unsafe markup removed')}catch(e){}}
return t.innerHTML});
}catch(e){}
/* Keyboard and click routers are registered first so they run before every other handler; their logic is defined later. */
addEventListener('keydown',e=>{try{if(window.r31Key&&window.r31Key(e)){e.preventDefault();e.stopImmediatePropagation()}}catch(x){}},true);
document.addEventListener('click',e=>{try{window.r31ClickCap&&window.r31ClickCap(e)}catch(x){}},true);
})();
