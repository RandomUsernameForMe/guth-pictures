#!/usr/bin/env node
// Render library/index.html — a self-contained tagged browser for the library.
// Every item is a tile showing its image + tags; filter chips (kind / emotion /
// shot / setting / lighting / palette) narrow the grid live. Use it to curate
// the library and to eyeball auto-match candidates.
//
// Usage: node scripts/build-library.mjs

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readManifest, VOCAB, LIST_AXES, LIB_ROOT, toList } from "./_library.mjs";

function esc(s = "") {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function dataAttrs(item) {
  const out = [`data-kind="${esc(item.kind)}"`];
  for (const axis of LIST_AXES) out.push(`data-${axis}="${esc(toList(item.tags?.[axis]).join(" "))}"`);
  out.push(`data-shot="${esc(item.tags?.shot || "")}"`);
  return out.join(" ");
}

function tagChipsHtml(item) {
  const pills = [];
  if (item.tags?.shot) pills.push(`<span class="t shot">${esc(item.tags.shot)}</span>`);
  for (const axis of LIST_AXES)
    for (const v of toList(item.tags?.[axis])) pills.push(`<span class="t ${axis}">${esc(v)}</span>`);
  if (item.needsTags) pills.push(`<span class="t needs">needs tags</span>`);
  return pills.join("");
}

function axisFilter(label, axis, values) {
  const chips = values
    .map((v) => `<button class="chip" data-axis="${axis}" data-val="${esc(v)}">${esc(v)}</button>`)
    .join("");
  return `<div class="frow"><span class="flabel">${esc(label)}</span>${chips}</div>`;
}

async function main() {
  const manifest = await readManifest();
  const items = manifest.items;

  const tiles = items.map((item) => `
    <figure class="tile" ${dataAttrs(item)}>
      <img loading="lazy" src="${esc(item.file)}" alt="${esc(item.id)}">
      <figcaption>
        <div class="id">${esc(item.id)}${item.note ? ` · <span class="note">${esc(item.note)}</span>` : ""}</div>
        <div class="tags">${tagChipsHtml(item)}</div>
      </figcaption>
    </figure>`).join("\n");

  const filters = [
    `<div class="frow"><span class="flabel">kind</span>
       <button class="chip" data-axis="kind" data-val="pose">pose</button>
       <button class="chip" data-axis="kind" data-val="moodboard">moodboard</button></div>`,
    axisFilter("emotion", "emotion", VOCAB.emotion),
    axisFilter("shot", "shot", VOCAB.shot),
    axisFilter("setting", "setting", VOCAB.setting),
    axisFilter("lighting", "lighting", VOCAB.lighting),
    axisFilter("palette", "palette", VOCAB.palette),
  ].join("\n");

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shoot library (${items.length})</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         background:#0e0f12; color:#e9e9ec; padding:24px; }
  h1 { margin:0 0 4px; font-size:22px; } .sub { color:#9a9aa3; margin-bottom:16px; }
  .filters { position:sticky; top:0; background:#0e0f12; padding:12px 0; z-index:5;
             border-bottom:1px solid #23252c; margin-bottom:18px; }
  .frow { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:6px; }
  .flabel { width:74px; color:#7a7a84; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .chip { border:1px solid #33363f; background:#16171c; color:#c7c7cf; border-radius:999px;
          padding:3px 11px; font-size:12px; cursor:pointer; }
  .chip.on { background:#3ddc97; color:#06231a; border-color:#3ddc97; font-weight:600; }
  #clear { margin-left:8px; color:#9a9aa3; background:none; border:1px solid #33363f;
           border-radius:6px; padding:3px 10px; cursor:pointer; }
  #count { color:#9a9aa3; font-size:12px; margin-left:8px; }
  .grid { column-count:4; column-gap:14px; }
  @media (max-width:1100px){ .grid{column-count:3;} } @media (max-width:760px){ .grid{column-count:2;} }
  .tile { break-inside:avoid; margin:0 0 14px; background:#16171c; border-radius:12px; overflow:hidden; }
  .tile.hide { display:none; }
  .tile img { width:100%; display:block; background:#fff; }
  figcaption { padding:8px 10px; }
  .id { font-size:12px; color:#cfcfd6; } .note { color:#9a9aa3; }
  .tags { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
  .t { font-size:10px; padding:1px 7px; border-radius:999px; background:#23252c; color:#b9b9c2; }
  .t.shot { background:#1f3a5f; color:#cfe2ff; } .t.emotion { background:#3a2f5f; color:#e0d3ff; }
  .t.needs { background:#5f2f2f; color:#ffd3d3; }
</style></head><body>
  <h1>Shoot library</h1>
  <div class="sub">${items.length} items · ${items.filter(i=>i.kind==="pose").length} poses · ${items.filter(i=>i.kind==="moodboard").length} moodboard · click chips to filter</div>
  <div class="filters">${filters}<div class="frow"><button id="clear">clear all</button><span id="count"></span></div></div>
  <section class="grid" id="grid">
${tiles}
  </section>
<script>
  const active = {}; // axis -> Set of values
  const grid = document.getElementById('grid');
  const tiles = [...grid.querySelectorAll('.tile')];
  function apply() {
    let shown = 0;
    for (const t of tiles) {
      let ok = true;
      for (const axis in active) {
        if (!active[axis].size) continue;
        const have = (t.dataset[axis] || '').split(' ').filter(Boolean);
        if (![...active[axis]].some(v => have.includes(v))) { ok = false; break; }
      }
      t.classList.toggle('hide', !ok);
      if (ok) shown++;
    }
    document.getElementById('count').textContent = shown + ' shown';
  }
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    const { axis, val } = c.dataset;
    active[axis] = active[axis] || new Set();
    if (active[axis].has(val)) { active[axis].delete(val); c.classList.remove('on'); }
    else { active[axis].add(val); c.classList.add('on'); }
    apply();
  }));
  document.getElementById('clear').addEventListener('click', () => {
    for (const k in active) active[k].clear();
    document.querySelectorAll('.chip.on').forEach(c => c.classList.remove('on'));
    apply();
  });
  apply();
</script>
</body></html>`;

  const out = join(LIB_ROOT, "index.html");
  await writeFile(out, html);
  console.log(`✓ library browser: ${out} (${items.length} items)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
