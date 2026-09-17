#!/usr/bin/env node
// Materialize chosen library items into a client's assets folder + merge their
// sources.json entries. This is the bridge that keeps the whole downstream
// pipeline (build-board, approvals, sync-to-web, web ProposalView) unchanged:
// after picking, the client folder looks exactly like a hand-fetched one.
//
// Usage:
//   node scripts/library-pick.mjs <slug> <pose|moodboard> <id> [<id> ...] [--concept A]
//
// Files are copied as the next 0001.<ext> numbers in the client dir (matching
// fetch-images.mjs naming); sources.json gains { file, hash, note, concept,
// libraryId } and dedupes by hash.

import { readFile, writeFile, copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { readManifest, LIB_ROOT, parseFlags } from "./_library.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLIENTS = resolve(HERE, "..", "clients");
const SUB_BY_KIND = { pose: "poses", poses: "poses", moodboard: "moodboard" };

async function main() {
  const f = parseFlags(process.argv.slice(2));
  const [slug, kindArg, ...ids] = f._;
  const sub = SUB_BY_KIND[kindArg];
  if (!slug || !sub || !ids.length) {
    console.error("Usage: library-pick.mjs <slug> <pose|moodboard> <id> [<id>...] [--concept A]");
    process.exit(1);
  }

  const destDir = join(CLIENTS, slug, "assets", sub);
  await mkdir(destDir, { recursive: true });

  // Load destination sources.json + existing hashes/indices (mirror fetch-images).
  const sourcesPath = join(destDir, "sources.json");
  let sources = [];
  if (existsSync(sourcesPath)) {
    try { sources = JSON.parse(await readFile(sourcesPath, "utf8")); } catch {}
  }
  const seenHashes = new Set(sources.map((s) => s.hash).filter(Boolean));
  let counter = (await readdir(destDir)).filter((f) => /^\d{4}\./.test(f)).length;

  const manifest = await readManifest();
  const byId = Object.fromEntries(manifest.items.map((i) => [i.id, i]));

  let added = 0, skipped = 0, missing = 0;
  for (const id of ids) {
    const item = byId[id];
    if (!item) { console.warn(`✗ unknown library id: ${id}`); missing++; continue; }
    if (item.hash && seenHashes.has(item.hash)) { console.log(`↷ already in client: ${id}`); skipped++; continue; }

    const srcPath = join(LIB_ROOT, item.file);
    if (!existsSync(srcPath)) { console.warn(`✗ file missing: ${item.file}`); missing++; continue; }
    const ext = item.file.split(".").pop().toLowerCase();
    const name = String(++counter).padStart(4, "0") + "." + ext;
    await copyFile(srcPath, join(destDir, name));
    const bytes = (await stat(srcPath)).size;

    const entry = { file: name, hash: item.hash, bytes, note: item.note || "", libraryId: id };
    if (item.url) entry.url = item.url;
    if (f.concept && f.concept !== true) entry.concept = f.concept;
    sources.push(entry);
    if (item.hash) seenHashes.add(item.hash);
    added++;
    console.log(`✓ ${name}  ← ${id}${entry.concept ? `  [${entry.concept}]` : ""}`);
  }

  await writeFile(sourcesPath, JSON.stringify(sources, null, 2));
  console.log(`\nDone. picked=${added} skipped=${skipped} missing=${missing}  -> ${destDir}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
