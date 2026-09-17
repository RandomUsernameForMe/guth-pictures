#!/usr/bin/env node
// Seed the library from images already produced for past clients.
// Walks clients/*/assets/{moodboard,poses}, reads each sources.json, and imports
// every image with addItem (content-hash dedupe). Imported items carry their
// original note and get needsTags:true (no tags yet) + a `harvestedFrom` trail —
// tag them afterward via the manifest or build-library browser.
//
// Usage:
//   node scripts/library-harvest.mjs                 # all clients
//   node scripts/library-harvest.mjs <slug> [<slug>] # specific clients

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { readManifest, writeManifest, parseFlags } from "./_library.mjs";
import { addItem } from "./library-add.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLIENTS = resolve(HERE, "..", "clients");
const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const KIND_BY_DIR = { moodboard: "moodboard", poses: "pose" };

async function harvestDir(slug, sub, kind, manifest, counters) {
  const dir = join(CLIENTS, slug, "assets", sub);
  if (!existsSync(dir)) return;

  let sources = [];
  const sp = join(dir, "sources.json");
  if (existsSync(sp)) {
    try { sources = JSON.parse(await readFile(sp, "utf8")); } catch {}
  }
  const noteByFile = Object.fromEntries(sources.map((s) => [s.file, s]));

  const files = (await readdir(dir)).filter((f) => IMG_RE.test(f)).sort();
  for (const file of files) {
    const buf = await readFile(join(dir, file));
    const ext = basename(file).split(".").pop().toLowerCase();
    const src = noteByFile[file] || {};
    const { item, deduped } = await addItem({
      kind, buf, ext, tags: {}, note: src.note, source: "harvest",
      url: src.url, manifest,
    });
    item.harvestedFrom = `${slug}/${sub}/${file}`;
    counters[deduped ? "deduped" : "added"]++;
  }
}

async function main() {
  const f = parseFlags(process.argv.slice(2));
  let slugs = f._;
  if (!slugs.length) {
    slugs = (await readdir(CLIENTS, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }

  const manifest = await readManifest();
  const counters = { added: 0, deduped: 0 };
  for (const slug of slugs) {
    for (const [sub, kind] of Object.entries(KIND_BY_DIR)) {
      await harvestDir(slug, sub, kind, manifest, counters);
    }
  }
  await writeManifest(manifest);
  console.log(`Harvested ${slugs.length} client(s): added=${counters.added} deduped=${counters.deduped}`);
  console.log("Imported items have needsTags:true — tag them in the manifest or the library browser.");
}

main().catch((e) => { console.error(e); process.exit(1); });
