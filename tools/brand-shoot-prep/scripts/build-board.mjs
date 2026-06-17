#!/usr/bin/env node
// Render a self-contained, printable HTML board (moodboard or pose board)
// from a folder of images + an optional color palette. Always-works deliverable
// that does not depend on any external service.
//
// Usage:
//   node scripts/build-board.mjs <images-dir> <out.html> [options]
//
// Options:
//   --title "Moodboard — Jane Doe"
//   --subtitle "Editorial authority"
//   --palette "#11151c,#c8a96a,#f4f1ea"   (comma-separated hex)
//   --notes "Warm rim light, muted earth tones, shallow DOF"
//
// Reads sources.json (written by fetch-images.mjs) if present, to label web
// references with their origin domain.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename, relative, dirname } from "node:path";

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

function parseArgs(argv) {
  const [imagesDir, outHtml, ...rest] = argv;
  const opts = { imagesDir, outHtml };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i]?.replace(/^--/, "");
    if (key) opts[key] = rest[i + 1];
  }
  return opts;
}

function esc(s = "") {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.imagesDir || !opts.outHtml) {
    console.error('Usage: build-board.mjs <images-dir> <out.html> [--title .. --subtitle .. --palette "#hex,#hex" --notes ..]');
    process.exit(1);
  }
  const imagesDir = resolve(opts.imagesDir);
  const outPath = resolve(opts.outHtml);

  const files = (await readdir(imagesDir)).filter((f) => IMG_RE.test(f)).sort();
  if (files.length === 0) console.warn(`Warning: no images found in ${imagesDir}`);

  // Optional source labels.
  let sources = {};
  const sp = join(imagesDir, "sources.json");
  if (existsSync(sp)) {
    try {
      for (const s of JSON.parse(await readFile(sp, "utf8"))) {
        if (s.file) {
          let host = "";
          try {
            host = s.url ? new URL(s.url).hostname.replace(/^www\./, "") : "";
          } catch {}
          sources[s.file] = { host, note: s.note || "" };
        }
      }
    } catch {}
  }

  const palette = (opts.palette || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  const title = opts.title || basename(imagesDir);
  const relFromOut = (f) => relative(dirname(outPath), join(imagesDir, f)).split("\\").join("/");

  const tiles = files
    .map((f) => {
      const src = sources[f] || {};
      const cap = [src.note, src.host].filter(Boolean).join(" · ");
      return `      <figure class="tile">
        <img loading="lazy" src="${esc(relFromOut(f))}" alt="${esc(f)}">
        ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ""}
      </figure>`;
    })
    .join("\n");

  const swatches = palette
    .map(
      (hex) =>
        `      <div class="swatch"><span style="background:${esc(hex)}"></span><code>${esc(hex)}</code></div>`
    )
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #0e0f12; color: #e9e9ec; padding: 32px; }
  header { max-width: 1200px; margin: 0 auto 24px; }
  h1 { margin: 0 0 4px; font-size: 26px; letter-spacing: -0.01em; }
  .subtitle { color: #a7a7b0; font-size: 16px; }
  .notes { max-width: 1200px; margin: 0 auto 20px; color: #c7c7cf; }
  .palette { max-width: 1200px; margin: 0 auto 28px; display: flex; gap: 14px; flex-wrap: wrap; }
  .swatch { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .swatch span { width: 64px; height: 64px; border-radius: 10px; display: block;
                 box-shadow: 0 1px 4px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.1); }
  .swatch code { font-size: 12px; color: #9a9aa3; }
  .grid { max-width: 1200px; margin: 0 auto;
          column-count: 4; column-gap: 14px; }
  @media (max-width: 1000px) { .grid { column-count: 3; } }
  @media (max-width: 700px)  { .grid { column-count: 2; } }
  .tile { break-inside: avoid; margin: 0 0 14px; background: #16171c; border-radius: 12px;
          overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,.35); }
  .tile img { width: 100%; display: block; }
  figcaption { padding: 8px 10px; font-size: 12px; color: #9a9aa3; }
  footer { max-width: 1200px; margin: 28px auto 0; color: #6f6f78; font-size: 12px; }
  @media print {
    body { background: #fff; color: #000; padding: 0; }
    .tile { box-shadow: none; border: 1px solid #ddd; background: #fff; }
    .grid { column-count: 3; }
  }
</style>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    ${opts.subtitle ? `<div class="subtitle">${esc(opts.subtitle)}</div>` : ""}
  </header>
  ${opts.notes ? `<div class="notes">${esc(opts.notes)}</div>` : ""}
  ${palette.length ? `<div class="palette">\n${swatches}\n  </div>` : ""}
  <section class="grid">
${tiles}
  </section>
  <footer>${files.length} images · generated ${new Date().toISOString().slice(0, 10)} · references for creative direction only</footer>
</body>
</html>
`;

  await writeFile(outPath, html);
  console.log(`✓ board written: ${outPath} (${files.length} images)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
