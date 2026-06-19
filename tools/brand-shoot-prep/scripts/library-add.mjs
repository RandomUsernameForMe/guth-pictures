#!/usr/bin/env node
// Add an item (local file or web URL) to the library with tags. Dedupes by
// content hash. Used directly, by library-harvest.mjs, and by gen-pose-sketch.mjs.
//
// Usage:
//   node scripts/library-add.mjs --kind pose --file path/to/img.png \
//        --emotion confident,calm --shot three-quarter --setting studio \
//        --lighting soft --palette neutral --note "weight on back foot"
//   node scripts/library-add.mjs --kind moodboard --url https://… --emotion warm --note "rim light"
//
// Returns the created item id on stdout (last line). Exit 0 on success/dedupe-skip.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readManifest, writeManifest, nextId, validateTags, sha16, dirFor, LIB_ROOT, parseFlags,
} from "./_library.mjs";

const EXT_BY_TYPE = {
  "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
  "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

// Reusable: fetch a URL to a Buffer + detect ext. Returns { buf, ext }.
export async function fetchImage(url) {
  const resp = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "Mozilla/5.0 (brand-shoot-prep library)" },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const type = (resp.headers.get("content-type") || "").split(";")[0].trim();
  const urlExt = url.split("?")[0].match(/\.([a-z0-9]{3,4})$/i)?.[1]?.toLowerCase();
  const ext = EXT_BY_TYPE[type] || urlExt || "jpg";
  return { buf, ext };
}

// Core add. opts: { kind, buf, ext, tags, note, source, url, prompt, manifest }
// If manifest is passed it is mutated + NOT written (caller batches the write).
export async function addItem(opts) {
  const { kind, buf, ext, note, source, url, prompt } = opts;
  const manifest = opts.manifest || (await readManifest());
  const hash = sha16(buf);

  const dup = manifest.items.find((i) => i.hash === hash);
  if (dup) return { item: dup, deduped: true, manifest };

  const { tags, warnings } = validateTags(opts.tags || {});
  for (const w of warnings) console.warn(`  ⚠ ${w}`);

  const id = nextId(manifest.items, kind);
  const file = `${kind === "pose" ? "poses" : "moodboard"}/${id}.${ext}`;
  const dir = dirFor(kind);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, `${id}.${ext}`), buf);

  const item = { id, kind, file, tags, hash };
  if (note) item.note = note;
  item.source = source || "web";
  if (url) item.url = url;
  if (prompt) item.prompt = prompt;
  if (!Object.keys(tags).length) item.needsTags = true;

  manifest.items.push(item);
  if (!opts.manifest) await writeManifest(manifest);
  return { item, deduped: false, manifest };
}

async function main() {
  const f = parseFlags(process.argv.slice(2));
  const kind = f.kind === "pose" ? "pose" : f.kind === "moodboard" ? "moodboard" : null;
  if (!kind || (!f.file && !f.url)) {
    console.error("Usage: library-add.mjs --kind pose|moodboard (--file <path> | --url <url>) [--emotion a,b --shot x --setting a --lighting a --palette a --note ..]");
    process.exit(1);
  }

  const tags = { emotion: f.emotion, shot: f.shot, setting: f.setting, lighting: f.lighting, palette: f.palette };
  let buf, ext, source, url;
  if (f.file) {
    const p = resolve(f.file);
    if (!existsSync(p)) { console.error(`file not found: ${p}`); process.exit(1); }
    buf = await readFile(p);
    ext = basename(p).split(".").pop()?.toLowerCase() || "png";
    source = "ai-import";
  } else {
    ({ buf, ext } = await fetchImage(f.url));
    source = "web";
    url = f.url;
  }

  const { item, deduped } = await addItem({ kind, buf, ext, tags, note: f.note, source: f.source || source, url, prompt: f.prompt });
  console.log(`${deduped ? "↷ deduped" : "✓ added"} ${item.id}  ${relative(LIB_ROOT, join(LIB_ROOT, item.file))}`);
  console.log(item.id);
}

// Only run main when invoked directly (not when imported).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
