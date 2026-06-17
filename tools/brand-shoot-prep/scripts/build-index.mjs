#!/usr/bin/env node
// Build a top-level gallery (clients/index.html) listing every client folder as a card:
// hero thumbnail, name, boarded concept, progress, and links to the full page / client
// proposal / PDF.
//
// Usage:
//   node scripts/build-index.mjs            (defaults to ./clients)
//   node scripts/build-index.mjs <clients-dir>

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const readIf = async (p) => (existsSync(p) ? readFile(p, "utf8") : "");

async function firstImage(dir) {
  if (!existsSync(dir)) return "";
  const files = (await readdir(dir)).filter((f) => IMG_RE.test(f)).sort();
  return files[0] || "";
}

async function main() {
  const clientsDir = resolve(process.argv[2] || "clients");
  if (!existsSync(clientsDir)) { console.error(`No such dir: ${clientsDir}`); process.exit(1); }

  const entries = [];
  for (const slug of (await readdir(clientsDir)).sort()) {
    const dir = join(clientsDir, slug);
    let st; try { st = await stat(dir); } catch { continue; }
    if (!st.isDirectory()) continue;

    const briefMd = await readIf(join(dir, "brief.md"));
    if (!briefMd && !existsSync(join(dir, "index.html"))) continue;

    const nameMatch = briefMd.match(/^#\s+(?:Brief\s+—\s+)?(.+)$/m);
    const name = nameMatch ? nameMatch[1].trim() : slug;
    const conceptMatch = briefMd.match(/Boarded concept:\**\s*(.+)/i);
    const concept = conceptMatch ? conceptMatch[1].replace(/\*/g, "").replace(/\.\s*See.*/i, "").trim() : "";
    const done = (briefMd.match(/- \[x\]/gi) || []).length;
    const total = (briefMd.match(/- \[[ x]\]/gi) || []).length;

    const thumbFile = await firstImage(join(dir, "assets", "moodboard"));
    const thumb = thumbFile ? `${slug}/assets/moodboard/${thumbFile}` : "";

    entries.push({
      slug, name, concept, done, total, thumb,
      hasPage: existsSync(join(dir, "index.html")),
      hasProposal: existsSync(join(dir, "proposal.html")),
      hasPdf: existsSync(join(dir, "deliverables", "presentation.pdf")),
    });
  }

  const cards = entries.map((e) => {
    const links = [
      e.hasPage ? `<a href="${esc(e.slug)}/index.html">Open</a>` : "",
      e.hasProposal ? `<a href="${esc(e.slug)}/proposal.html">Proposal</a>` : "",
      e.hasPdf ? `<a href="${esc(e.slug)}/deliverables/presentation.pdf" target="_blank">PDF</a>` : "",
    ].filter(Boolean).join('<span class="dot">·</span>');
    const prog = e.total ? `${e.done}/${e.total}` : "";
    const href = e.hasPage ? `${esc(e.slug)}/index.html` : (e.hasProposal ? `${esc(e.slug)}/proposal.html` : "#");
    return `<article class="card">
      <a class="thumb" href="${href}" ${e.thumb ? `style="background-image:url('${esc(e.thumb)}')"` : 'data-empty="1"'}>
        ${prog ? `<span class="badge">${esc(prog)}</span>` : ""}
      </a>
      <div class="body">
        <h2><a href="${href}">${esc(e.name)}</a></h2>
        ${e.concept ? `<div class="concept">${esc(e.concept)}</div>` : `<div class="concept muted">in progress</div>`}
        <div class="links">${links || '<span class="muted">no page yet</span>'}</div>
      </div>
    </article>`;
  }).join("\n");

  const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Clients — Brand Shoot Prep</title>
<style>
  :root{--bg:#0c0d11;--surface:#15171d;--surface2:#1c1f27;--text:#e9eaee;--muted:#9aa0ab;--line:#272b34;--accent:#3ddc97}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
  header{border-bottom:1px solid var(--line);padding:26px 24px}
  .wrap{max-width:1100px;margin:0 auto}
  h1{margin:0;font-size:24px;letter-spacing:-.01em} .sub{color:var(--muted);font-size:13px;margin-top:3px}
  main{max-width:1100px;margin:0 auto;padding:28px 24px 80px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden;transition:.15s}
  .card:hover{border-color:var(--accent);transform:translateY(-2px)}
  .thumb{display:block;height:150px;background:var(--surface2) center/cover no-repeat;position:relative}
  .thumb[data-empty]{background:linear-gradient(135deg,var(--surface),var(--surface2))}
  .badge{position:absolute;top:10px;right:10px;background:rgba(0,0,0,.6);color:#fff;font-size:12px;
         padding:3px 9px;border-radius:999px}
  .body{padding:14px 16px}
  h2{margin:0 0 4px;font-size:17px} h2 a{color:var(--text);text-decoration:none}
  .concept{color:var(--accent);font-size:13px} .concept.muted{color:var(--muted)}
  .links{margin-top:10px;font-size:13px} .links a{color:var(--accent);text-decoration:none}
  .links a:hover{text-decoration:underline} .dot{color:var(--muted);margin:0 7px}
  .muted{color:var(--muted)}
  footer{max-width:1100px;margin:0 auto;padding:0 24px 50px;color:var(--muted);font-size:12px}
</style>
</head>
<body>
<header><div class="wrap"><h1>Brand Shoot Prep</h1><div class="sub">${entries.length} client${entries.length === 1 ? "" : "s"} · generated ${new Date().toISOString().slice(0, 10)}</div></div></header>
<main><div class="grid">
${cards || '<p class="muted">No clients yet. Run /brandshoot to add one.</p>'}
</div></main>
<footer>Reference imagery for creative direction only.</footer>
</body>
</html>
`;

  const outPath = join(clientsDir, "index.html");
  await writeFile(outPath, page);
  console.log(`✓ clients index written: ${outPath} (${entries.length} client${entries.length === 1 ? "" : "s"})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
