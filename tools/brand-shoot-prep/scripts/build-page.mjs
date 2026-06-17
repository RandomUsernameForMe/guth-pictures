#!/usr/bin/env node
// Build a self-contained, interactive client page from a client folder.
// Exposes build() for reuse (build-share imports it) and a CLI wrapper.
//
// Usage:
//   node scripts/build-page.mjs clients/<slug> [options]
//
// Options:
//   --client            Client-facing build: hides internal tabs/notes; writes proposal.html.
//                       If approvals.json exists, shows ONLY approved concepts + images.
//   --approved-only     Force approved-only filtering even outside --client (used by share build).
//   --cover <file>      Hero image filename (relative to assets/moodboard). Default: first approved/first image.
//   --out <file>        Override output filename.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
export const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const readIf = async (p) => (existsSync(p) ? readFile(p, "utf8") : "");
const isApproved = (s) => s === "approved";

// --- minimal build-time markdown -> html ---
function inline(s) {
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/(^|[^"=>])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}
export function mdToHtml(md) {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const out = []; let i = 0; const paras = [];
  const flushP = () => { if (paras.length) { out.push(`<p>${inline(paras.join(" "))}</p>`); paras.length = 0; } };
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { flushP(); i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flushP(); const l = m[1].length; out.push(`<h${l}>${inline(m[2])}</h${l}>`); i++; continue; }
    if (/^\s*(---|___|\*\*\*)\s*$/.test(line)) { flushP(); out.push("<hr>"); i++; continue; }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flushP(); const header = line.split("|").slice(1, -1).map((c) => c.trim()); i += 2; const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim())); i++; }
      out.push(`<table><thead><tr>${header.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>` +
        rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("") + `</tbody></table>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushP(); const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`); i++; }
      out.push(`<ul>${items.join("")}</ul>`); continue;
    }
    paras.push(line.trim()); i++;
  }
  flushP();
  return out.join("\n");
}

function stripSections(md, titles) {
  const out = []; let skip = false;
  for (const line of (md || "").split("\n")) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) skip = titles.some((t) => new RegExp(t, "i").test(h[1]));
    if (!skip) out.push(line);
  }
  return out.join("\n");
}

// Split approaches.md into concept blocks keyed by letter (A/B/C...).
export function splitConcepts(md) {
  const lines = (md || "").split("\n");
  let preamble = [], tail = [], cur = null;
  const concepts = []; let phase = "pre";
  for (const line of lines) {
    const cm = line.match(/^##\s+Concept\s+([A-Z])\b/);
    const rec = /^###?\s+Recommendation/i.test(line);
    if (cm) { if (cur) concepts.push(cur); cur = { letter: cm[1], lines: [line] }; phase = "concept"; continue; }
    if (rec) { if (cur) { concepts.push(cur); cur = null; } phase = "tail"; tail.push(line); continue; }
    if (phase === "pre") preamble.push(line);
    else if (phase === "concept" && cur) cur.lines.push(line);
    else tail.push(line);
  }
  if (cur) concepts.push(cur);
  return { preamble: preamble.join("\n"), concepts: concepts.map((c) => ({ letter: c.letter, md: c.lines.join("\n") })), tail: tail.join("\n") };
}

export async function loadApprovals(dir) {
  const p = join(dir, "approvals.json");
  if (!existsSync(p)) return null;
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return null; }
}

async function gallery(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => IMG_RE.test(f)).sort();
  let sources = {};
  const sp = join(dir, "sources.json");
  if (existsSync(sp)) {
    try { for (const s of JSON.parse(await readFile(sp, "utf8"))) {
      if (s.file) { let host = ""; try { host = s.url ? new URL(s.url).hostname.replace(/^www\./, "") : ""; } catch {} sources[s.file] = { note: s.note || "", host, url: s.url || "" }; }
    } } catch {}
  }
  return files.map((f) => ({ file: f, ...(sources[f] || {}) }));
}

function galleryHtml(rel, items, { clientMode, statusOf }) {
  if (!items.length) return `<p class="muted">No images.</p>`;
  return `<div class="grid">` + items.map((it) => {
    const src = `${rel}/${it.file}`;
    const cap = clientMode ? (it.note || "") : [it.note, it.host].filter(Boolean).join(" · ");
    const st = statusOf ? statusOf(it.file) : null;
    const badge = (!clientMode && st) ? `<span class="abadge ${st}">${st === "approved" ? "✓" : st === "rejected" ? "✗" : "•"}</span>` : "";
    return `<figure class="tile" data-full="${esc(src)}" data-cap="${esc(cap)}">
      ${badge}<img loading="lazy" src="${esc(src)}" alt="${esc(it.note || it.file)}">
      ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}
    </figure>`;
  }).join("") + `</div>`;
}

// Core builder. Returns { html, outName, moodUsed, poseUsed }.
export async function build({ dir, client = false, approvedOnly = false, cover = null, out = null }) {
  dir = resolve(dir);
  const slug = basename(dir);
  const clientMode = client;
  const filterApproved = approvedOnly || clientMode; // client view is approved-only when approvals exist

  const briefMd = await readIf(join(dir, "brief.md"));
  const researchMd = await readIf(join(dir, "research.md"));
  const approachesMd = await readIf(join(dir, "approaches.md"));
  let canvaMd = await readIf(join(dir, "deliverables", "canva-links.md"));
  const approvals = await loadApprovals(dir);

  const nameMatch = briefMd.match(/^#\s+(?:Brief\s+—\s+)?(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : slug;
  const conceptMatch = briefMd.match(/Boarded concept:\**\s*(.+)/i);
  const concept = conceptMatch ? conceptMatch[1].replace(/\*/g, "").replace(/\.\s*See.*/i, "").trim() : "";

  const palette = [...new Set((approachesMd.match(/#[0-9a-fA-F]{6}/g) || []))];

  let mood = await gallery(join(dir, "assets", "moodboard"));
  let poses = await gallery(join(dir, "assets", "poses"));
  const moodStatus = (f) => approvals?.moodboard?.[f] || "pending";
  const poseStatus = (f) => approvals?.poses?.[f] || "pending";

  // approved-only filtering for client/share views (only when approvals exist)
  if (filterApproved && approvals) {
    mood = mood.filter((it) => isApproved(moodStatus(it.file)));
    poses = poses.filter((it) => isApproved(poseStatus(it.file)));
  }

  // concept filtering for client view
  let approachesHtml;
  if (clientMode) {
    const { preamble, concepts } = splitConcepts(approachesMd);
    const keep = concepts.filter((c) => !approvals || isApproved(approvals?.concepts?.[c.letter]));
    approachesHtml = mdToHtml(preamble) + keep.map((c) => mdToHtml(c.md)).join("\n");
  } else {
    approachesHtml = mdToHtml(approachesMd);
  }

  const accent = palette.find((h) => !/^#0|^#1|^#2/.test(h)) || palette[palette.length - 1] || "#3ddc97";
  const coverFile = cover || (mood[0] ? mood[0].file : null);
  const coverPath = coverFile ? `assets/moodboard/${coverFile}` : "";

  const swatchRow = palette.length
    ? `<div class="palette">${palette.map((h) => `<span class="sw" style="background:${esc(h)}" title="${esc(h)}"></span>`).join("")}<code>${palette.map(esc).join("  ")}</code></div>`
    : "";

  const hasPdf = existsSync(join(dir, "deliverables", "presentation.pdf"));
  const deck = (canvaMd.match(/https:\/\/www\.canva\.com\/d\/[A-Za-z0-9_-]+/g) || [])[0] || "";
  const folder = (canvaMd.match(/https:\/\/www\.canva\.com\/folder\/[A-Za-z0-9_-]+/) || [])[0] || "";

  const ctas = [
    hasPdf ? `<a class="btn primary" href="deliverables/presentation.pdf" target="_blank">📄 Open PDF deck</a>` : "",
    deck ? `<a class="btn" href="${esc(deck)}" target="_blank">📊 Canva deck</a>` : "",
    (!clientMode && folder) ? `<a class="btn" href="${esc(folder)}" target="_blank">📁 Canva folder</a>` : "",
  ].filter(Boolean).join("");

  if (clientMode) canvaMd = stripSections(canvaMd, ["Notes", "Alternate"]);
  const deliverablesHtml = (ctas ? `<div class="ctas">${ctas}</div>` : "") +
    (clientMode ? "" : (mdToHtml(canvaMd) || `<p class="muted">No deliverables yet.</p>`));

  let tabs = [
    ["overview", "Overview", mdToHtml(briefMd), true],
    ["research", "Research", mdToHtml(researchMd), true],
    ["approaches", clientMode ? "Concept" : "Approaches", swatchRow + approachesHtml, false],
    ["moodboard", "Moodboard", swatchRow + galleryHtml("assets/moodboard", mood, { clientMode, statusOf: moodStatus }), false],
    ["poses", "Pose Board", swatchRow + galleryHtml("assets/poses", poses, { clientMode, statusOf: poseStatus }), false],
    ["deliverables", clientMode ? "Deck" : "Deliverables", deliverablesHtml, false],
  ];
  if (clientMode) tabs = tabs.filter(([, , , internal]) => !internal);

  const nav = tabs.map(([id, label], idx) => `<button class="tab${idx === 0 ? " active" : ""}" data-tab="${id}">${esc(label)}</button>`).join("");
  const panels = tabs.map(([id, , html], idx) => `<section class="panel${idx === 0 ? " active" : ""}" id="panel-${id}">${html}</section>`).join("\n");

  const hero = `<div class="hero ${coverPath ? "" : "nohero"}" ${coverPath ? `style="--cover:url('${esc(coverPath)}')"` : ""}>
      <div class="hero-inner"><h1 class="name">${esc(name)}</h1>
      <div class="kick">${esc(concept ? concept + " · " : "")}${clientMode ? "Shoot Proposal" : "Brand Shoot Prep"}</div></div></div>`;

  const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} — ${clientMode ? "Shoot Proposal" : "Brand Shoot Prep"}</title>
<style>
  :root{ --accent:${esc(accent)}; }
  html[data-theme=dark]{ --bg:#0c0d11; --surface:#15171d; --surface2:#1c1f27; --text:#e9eaee; --muted:#9aa0ab; --line:#272b34; --herotint:rgba(12,13,17,.55); --heroink:#fff; }
  html[data-theme=light]{ --bg:#f6f7f9; --surface:#fff; --surface2:#eef0f3; --text:#1a1d23; --muted:#5f6672; --line:#e2e5ea; --herotint:rgba(20,22,28,.42); --heroink:#fff; }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  a{color:var(--accent)}
  .hero{position:relative;min-height:230px;display:flex;align-items:flex-end;background-image:linear-gradient(var(--herotint),var(--herotint)),var(--cover);background-size:cover;background-position:center}
  .hero.nohero{background:linear-gradient(135deg,var(--surface),var(--surface2))}
  .hero-inner{max-width:1080px;margin:0 auto;width:100%;padding:28px 24px}
  .hero .name{margin:0;font-size:34px;letter-spacing:-.02em;color:var(--heroink);text-shadow:0 2px 18px rgba(0,0,0,.45)}
  .hero .kick{color:#eef0f3;font-size:14px;margin-top:4px;text-shadow:0 1px 10px rgba(0,0,0,.5)}
  .hero.nohero .name,.hero.nohero .kick{color:var(--text);text-shadow:none}
  header{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding:12px 24px}
  .bar{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:12px}
  nav{display:flex;gap:6px;flex-wrap:wrap;flex:1}
  .tab{appearance:none;border:1px solid var(--line);background:var(--surface);color:var(--muted);padding:8px 14px;border-radius:999px;font-size:14px;cursor:pointer;transition:.15s}
  .tab:hover{color:var(--text)} .tab.active{background:var(--accent);color:#06210f;border-color:var(--accent);font-weight:600}
  #themeBtn{appearance:none;border:1px solid var(--line);background:var(--surface);color:var(--muted);width:38px;height:38px;border-radius:10px;cursor:pointer;font-size:16px}
  main{max-width:1080px;margin:0 auto;padding:28px 24px 80px}
  .panel{display:none;animation:fade .2s ease} .panel.active{display:block}
  @keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  h1,h2,h3{line-height:1.25;letter-spacing:-.01em}
  h1{font-size:22px;margin:.2em 0 .5em} h2{font-size:18px;margin:1.4em 0 .5em} h3{font-size:15px;margin:1.2em 0 .4em;color:var(--accent)}
  hr{border:none;border-top:1px solid var(--line);margin:1.6em 0}
  code{background:var(--surface2);padding:1px 6px;border-radius:6px;font-size:13px}
  table{border-collapse:collapse;width:100%;margin:1em 0;font-size:14px}
  th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top} th{background:var(--surface2)}
  ul{padding-left:20px} li{margin:.2em 0} .muted{color:var(--muted)}
  .palette{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 18px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px}
  .palette .sw{width:30px;height:30px;border-radius:7px;border:1px solid rgba(128,128,128,.25)} .palette code{background:none;color:var(--muted)}
  .ctas{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 22px}
  .btn{display:inline-block;border:1px solid var(--line);background:var(--surface);padding:10px 16px;border-radius:10px;text-decoration:none;color:var(--text);font-size:14px}
  .btn:hover{border-color:var(--accent)} .btn.primary{background:var(--accent);color:#06210f;border-color:var(--accent);font-weight:600}
  .grid{columns:4;column-gap:14px} @media(max-width:900px){.grid{columns:3}} @media(max-width:620px){.grid{columns:2}}
  .tile{position:relative;break-inside:avoid;margin:0 0 14px;background:var(--surface);border-radius:12px;overflow:hidden;border:1px solid var(--line);cursor:zoom-in;transition:.15s}
  .tile:hover{border-color:var(--accent);transform:translateY(-2px)} .tile img{width:100%;display:block}
  figcaption{padding:8px 10px;font-size:12px;color:var(--muted)}
  .abadge{position:absolute;top:8px;left:8px;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;z-index:2}
  .abadge.approved{background:#1f9d57} .abadge.rejected{background:#c0392b} .abadge.pending{background:#6b7280}
  #lb{position:fixed;inset:0;background:rgba(0,0,0,.92);display:none;z-index:50;align-items:center;justify-content:center;flex-direction:column;cursor:zoom-out;padding:24px}
  #lb.open{display:flex} #lb img{max-width:92vw;max-height:84vh;border-radius:10px} #lb .cap{color:#cfd3da;margin-top:12px;font-size:14px}
  footer{max-width:1080px;margin:0 auto;padding:0 24px 50px;color:var(--muted);font-size:12px}
  @media print{
    html[data-theme=dark]{--bg:#fff;--surface:#fff;--surface2:#f3f4f6;--text:#000;--muted:#444;--line:#ccc}
    header,#themeBtn,#lb{display:none!important} .hero{min-height:160px}
    .panel{display:block!important;page-break-before:always} .panel:first-of-type{page-break-before:avoid}
    .grid{columns:3} .tile{border:1px solid #ddd} a{color:#000;text-decoration:underline}
  }
</style></head>
<body>
${hero}
<header><div class="bar"><nav>${nav}</nav><button id="themeBtn" title="Toggle light/dark" aria-label="Toggle theme">◐</button></div></header>
<main>
${panels}
</main>
<footer>${clientMode ? "Prepared proposal." : "Reference imagery for creative direction only."} · ${slug}</footer>
<div id="lb"><img alt=""><div class="cap"></div></div>
<script>
  const tabs=[...document.querySelectorAll('.tab')],panels=[...document.querySelectorAll('.panel')];
  tabs.forEach(t=>t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('active'));panels.forEach(p=>p.classList.remove('active'));t.classList.add('active');document.getElementById('panel-'+t.dataset.tab).classList.add('active');history.replaceState(null,'','#'+t.dataset.tab);}));
  const h=location.hash.slice(1);if(h){const b=document.querySelector('.tab[data-tab="'+h+'"]');if(b)b.click();}
  const root=document.documentElement,tb=document.getElementById('themeBtn');const saved=localStorage.getItem('bsp-theme');if(saved)root.dataset.theme=saved;
  tb.addEventListener('click',()=>{const n=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=n;localStorage.setItem('bsp-theme',n);});
  const lb=document.getElementById('lb'),lbi=lb.querySelector('img'),lbc=lb.querySelector('.cap');
  document.addEventListener('click',e=>{const f=e.target.closest('.tile');if(f){lbi.src=f.dataset.full;lbc.textContent=f.dataset.cap||'';lb.classList.add('open');}});
  lb.addEventListener('click',()=>lb.classList.remove('open'));document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('open');});
</script>
</body></html>
`;

  const outName = out || (clientMode ? "proposal.html" : "index.html");
  return { html, outName, name, slug, moodUsed: mood.map((m) => m.file), poseUsed: poses.map((p) => p.file), hasPdf };
}

// CLI
async function cli() {
  const argv = process.argv.slice(2);
  const opts = { dir: null, client: false, approvedOnly: false, cover: null, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--client") opts.client = true;
    else if (a === "--approved-only") opts.approvedOnly = true;
    else if (a === "--cover") opts.cover = argv[++i];
    else if (a === "--out") opts.out = argv[++i];
    else if (!opts.dir) opts.dir = a;
  }
  if (!opts.dir) { console.error("Usage: build-page.mjs clients/<slug> [--client] [--cover file] [--out file]"); process.exit(1); }
  const res = await build(opts);
  const outPath = join(resolve(opts.dir), res.outName);
  await writeFile(outPath, res.html);
  console.log(`✓ ${opts.client ? "client proposal" : "page"} written: ${outPath}`);
  console.log(`  mood ${res.moodUsed.length} · poses ${res.poseUsed.length}${opts.client ? " (approved-only when approvals.json present)" : ""}`);
}

// run as CLI only when invoked directly (pathToFileURL handles spaces/encoding)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli().catch((e) => { console.error(e); process.exit(1); });
