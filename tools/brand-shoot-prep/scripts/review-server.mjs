#!/usr/bin/env node
// Local approval/preparation UI. Lets the photographer approve/reject each concept and
// each moodboard / pose image before anything reaches the client. Saves to
// clients/<slug>/approvals.json. "Finalize" rebuilds proposal.html (approved-only).
//
// Usage:
//   node scripts/review-server.mjs [--port 4321] [--open]
// Then open http://localhost:4321 and pick a client.
//
// No dependencies (node:http). Runs locally only — purely for your own review.

import { createServer } from "node:http";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import { join, resolve, extname } from "node:path";
import { build, splitConcepts } from "./build-page.mjs";

const PORT = Number((process.argv.find((a) => a.startsWith("--port=")) || "").split("=")[1]) ||
  (process.argv.includes("--port") ? Number(process.argv[process.argv.indexOf("--port") + 1]) : 0) || 4321;
const ROOT = resolve("clients");
const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif", ".html": "text/html; charset=utf-8", ".json": "application/json" };
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function loadApprovals(dir) {
  const p = join(dir, "approvals.json");
  if (!existsSync(p)) return { finalized: false, finalizedAt: null, concepts: {}, moodboard: {}, poses: {} };
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return { finalized: false, finalizedAt: null, concepts: {}, moodboard: {}, poses: {} }; }
}
async function saveApprovals(dir, a) { await writeFile(join(dir, "approvals.json"), JSON.stringify(a, null, 2)); }

async function listClients() {
  if (!existsSync(ROOT)) return [];
  const out = [];
  for (const slug of (await readdir(ROOT)).sort()) {
    const dir = join(ROOT, slug);
    let st; try { st = await stat(dir); } catch { continue; }
    if (st.isDirectory() && existsSync(join(dir, "brief.md"))) out.push(slug);
  }
  return out;
}

async function imagesIn(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => IMG_RE.test(f)).sort();
  let src = {};
  const sp = join(dir, "sources.json");
  if (existsSync(sp)) { try { for (const s of JSON.parse(await readFile(sp, "utf8"))) if (s.file) src[s.file] = s.note || ""; } catch {} }
  return files.map((f) => ({ file: f, note: src[f] || "" }));
}

async function manifest(slug) {
  const dir = join(ROOT, slug);
  const approachesMd = existsSync(join(dir, "approaches.md")) ? await readFile(join(dir, "approaches.md"), "utf8") : "";
  const { concepts } = splitConcepts(approachesMd);
  const conceptList = concepts.map((c) => {
    const titleLine = c.md.split("\n").find((l) => /^##\s+Concept/.test(l)) || `Concept ${c.letter}`;
    return { letter: c.letter, title: titleLine.replace(/^##\s+/, "") };
  });
  return {
    slug,
    concepts: conceptList,
    moodboard: await imagesIn(join(dir, "assets", "moodboard")),
    poses: await imagesIn(join(dir, "assets", "poses")),
    approvals: await loadApprovals(dir),
  };
}

function body(req) {
  return new Promise((res) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { res(JSON.parse(d || "{}")); } catch { res({}); } }); });
}
const json = (r, o, code = 200) => { r.writeHead(code, { "content-type": "application/json" }); r.end(JSON.stringify(o)); };

const PAGE = (slug) => `<!doctype html><html lang=en data-theme=dark><head><meta charset=utf-8>
<meta name=viewport content="width=device-width,initial-scale=1"><title>Review — ${esc(slug)}</title>
<style>
:root{--bg:#0c0d11;--s:#15171d;--s2:#1c1f27;--t:#e9eaee;--m:#9aa0ab;--l:#272b34;--ok:#1f9d57;--no:#c0392b;--ac:#3ddc97}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--t);font:15px/1.6 -apple-system,system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;background:rgba(12,13,17,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--l);padding:16px 24px;display:flex;gap:14px;align-items:center}
header h1{font-size:18px;margin:0;flex:1} a{color:var(--ac)}
.pill{font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid var(--l);color:var(--m)}
.pill.fin{background:var(--ok);color:#04210f;border-color:var(--ok);font-weight:600}
main{max-width:1080px;margin:0 auto;padding:24px}
h2{font-size:16px;margin:26px 0 12px} .muted{color:var(--m)}
.row{display:flex;gap:10px;align-items:flex-start;background:var(--s);border:1px solid var(--l);border-radius:10px;padding:12px;margin-bottom:10px}
.row .meta{flex:1} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.card{background:var(--s);border:1px solid var(--l);border-radius:12px;overflow:hidden}
.card img{width:100%;height:150px;object-fit:cover;display:block;background:var(--s2)}
.card .c{padding:8px 10px} .card .note{font-size:12px;color:var(--m);min-height:18px}
.btns{display:flex;gap:6px;margin-top:8px} .b{flex:1;appearance:none;border:1px solid var(--l);background:var(--s2);color:var(--m);border-radius:8px;padding:6px;font-size:13px;cursor:pointer}
.b.on.ok{background:var(--ok);color:#04210f;border-color:var(--ok);font-weight:700}
.b.on.no{background:var(--no);color:#fff;border-color:var(--no);font-weight:700}
.bar{position:sticky;bottom:0;background:rgba(12,13,17,.92);backdrop-filter:blur(8px);border-top:1px solid var(--l);padding:14px 24px;display:flex;gap:12px;align-items:center}
.bar .stat{flex:1;color:var(--m);font-size:14px}
.fbtn{appearance:none;border:none;background:var(--ac);color:#04210f;font-weight:700;padding:11px 20px;border-radius:10px;cursor:pointer;font-size:15px}
.fbtn[disabled]{opacity:.4;cursor:not-allowed}
</style></head><body>
<header><h1>Review · <span id=name>${esc(slug)}</span></h1><span id=finpill class=pill>draft</span><a href="/">← all clients</a></header>
<main>
<h2>Concepts <span class=muted id=cc></span></h2><div id=concepts></div>
<h2>Moodboard <span class=muted id=mc></span></h2><div id=mood class=grid></div>
<h2>Pose board <span class=muted id=pc></span></h2><div id=poses class=grid></div>
</main>
<div class=bar><div class=stat id=stat>loading…</div>
<button class=fbtn id=fin>Finalize & build client view</button></div>
<script>
const slug=${JSON.stringify(slug)};let M=null;
const api=(p,b)=>fetch(p,b?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}:{}).then(r=>r.json());
function st(kind,id){return (M.approvals[kind]&&M.approvals[kind][id])||'pending';}
function set(kind,id,status){api('/api/set',{slug,kind,id,status}).then(r=>{M.approvals=r.approvals;render();});}
function toggleBtns(kind,id){const s=st(kind,id);
 return '<div class=btns><button class="b ok '+(s==='approved'?'on':'')+'" onclick="set(\\''+kind+'\\',\\''+id+'\\',\\''+(s==='approved'?'pending':'approved')+'\\')">✓ approve</button>'
 +'<button class="b no '+(s==='rejected'?'on':'')+'" onclick="set(\\''+kind+'\\',\\''+id+'\\',\\''+(s==='rejected'?'pending':'rejected')+'\\')">✗ reject</button></div>';}
function render(){
 document.getElementById('concepts').innerHTML=M.concepts.map(c=>'<div class=row><div class=meta><strong>'+c.title+'</strong></div>'+toggleBtns('concepts',c.letter)+'</div>').join('')||'<p class=muted>No concepts.</p>';
 const card=(kind,it)=>'<div class=card><img loading=lazy src="/img/'+slug+'/'+(kind==='moodboard'?'moodboard':'poses')+'/'+it.file+'"><div class=c><div class=note>'+(it.note||it.file)+'</div>'+toggleBtns(kind,it.file)+'</div></div>';
 document.getElementById('mood').innerHTML=M.moodboard.map(it=>card('moodboard',it)).join('');
 document.getElementById('poses').innerHTML=M.poses.map(it=>card('poses',it)).join('');
 const count=(arr,kind)=>arr.filter(x=>st(kind,x.letter||x.file)==='approved').length;
 const ca=count(M.concepts,'concepts'),ma=count(M.moodboard,'moodboard'),pa=count(M.poses,'poses');
 document.getElementById('cc').textContent='('+ca+'/'+M.concepts.length+' approved)';
 document.getElementById('mc').textContent='('+ma+'/'+M.moodboard.length+' approved)';
 document.getElementById('pc').textContent='('+pa+'/'+M.poses.length+' approved)';
 document.getElementById('stat').textContent='Approved: '+ca+' concept(s), '+ma+' mood, '+pa+' pose';
 const fin=M.approvals.finalized;document.getElementById('finpill').textContent=fin?'finalized':'draft';
 document.getElementById('finpill').className='pill'+(fin?' fin':'');
 document.getElementById('fin').disabled=(ca+ma+pa)===0;
}
document.getElementById('fin').addEventListener('click',()=>{
 document.getElementById('fin').textContent='Building…';
 api('/api/finalize',{slug}).then(r=>{M.approvals=r.approvals;render();
  document.getElementById('fin').textContent='Finalize & build client view';
  alert('Client view built: proposal.html\\nApproved '+r.counts.mood+' mood / '+r.counts.pose+' pose / '+r.counts.concepts+' concept(s).');});
});
api('/api/state?slug='+encodeURIComponent(slug)).then(r=>{M=r;render();});
</script></body></html>`;

const INDEX = (slugs) => `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Review — pick client</title>
<style>body{margin:0;background:#0c0d11;color:#e9eaee;font:15px/1.6 system-ui,sans-serif}main{max-width:720px;margin:0 auto;padding:40px 24px}h1{font-size:22px}a{display:block;padding:14px 16px;margin:8px 0;background:#15171d;border:1px solid #272b34;border-radius:12px;color:#3ddc97;text-decoration:none}a:hover{border-color:#3ddc97}</style>
</head><body><main><h1>Review — pick a client</h1>${slugs.map((s) => `<a href="/review/${encodeURIComponent(s)}">${esc(s)}</a>`).join("") || "<p>No clients yet.</p>"}</main></body></html>`;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = decodeURIComponent(url.pathname);

    if (p === "/") { const s = await listClients(); res.writeHead(200, { "content-type": MIME[".html"] }); return res.end(INDEX(s)); }
    if (p.startsWith("/review/")) { const slug = p.slice("/review/".length); res.writeHead(200, { "content-type": MIME[".html"] }); return res.end(PAGE(slug)); }

    if (p === "/api/state") { const slug = url.searchParams.get("slug"); return json(res, await manifest(slug)); }

    if (p === "/api/set" && req.method === "POST") {
      const { slug, kind, id, status } = await body(req);
      const dir = join(ROOT, slug); const a = await loadApprovals(dir);
      a[kind] = a[kind] || {};
      if (status === "pending") delete a[kind][id]; else a[kind][id] = status;
      a.finalized = false; // any change reopens draft
      await saveApprovals(dir, a);
      return json(res, { ok: true, approvals: a });
    }

    if (p === "/api/finalize" && req.method === "POST") {
      const { slug } = await body(req);
      const dir = join(ROOT, slug); const a = await loadApprovals(dir);
      a.finalized = true; a.finalizedAt = new Date().toISOString();
      await saveApprovals(dir, a);
      const r = await build({ dir, client: true });
      await writeFile(join(dir, r.outName), r.html);
      return json(res, { ok: true, approvals: a, counts: { mood: r.moodUsed.length, pose: r.poseUsed.length, concepts: Object.values(a.concepts || {}).filter((s) => s === "approved").length } });
    }

    if (p.startsWith("/img/")) {
      const rel = p.slice("/img/".length); // <slug>/<moodboard|poses>/<file>
      const [slug, kind, file] = rel.split("/");
      const fp = join(ROOT, slug, "assets", kind, file);
      if (existsSync(fp)) { res.writeHead(200, { "content-type": MIME[extname(fp).toLowerCase()] || "application/octet-stream" }); return createReadStream(fp).pipe(res); }
    }

    res.writeHead(404); res.end("not found");
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Review server: ${url}`);
  if (process.argv.includes("--open")) import("node:child_process").then(({ exec }) => exec(`open ${url}`));
});
