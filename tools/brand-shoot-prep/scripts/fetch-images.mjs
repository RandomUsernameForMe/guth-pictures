#!/usr/bin/env node
// Download a list of image URLs into a folder, dedupe, and record sources.
//
// Usage:
//   node scripts/fetch-images.mjs <out-dir> <url> [<url> ...]
//   node scripts/fetch-images.mjs <out-dir> --list urls.txt
//   echo '[{"url":"...","note":"warm rim light"}]' | node scripts/fetch-images.mjs <out-dir> --json
//
// Writes images as 0001.<ext>, 0002.<ext>, ... and a sidecar sources.json
// mapping each saved file to its source URL (+ optional note) for attribution
// and later upload to Canva via upload-asset-from-url.

import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function extFromUrl(url) {
  const m = url.split("?")[0].match(/\.([a-z0-9]{3,4})$/i);
  return m ? m[1].toLowerCase() : null;
}

async function collectInputs(args) {
  // args: everything after out-dir
  const items = [];
  if (args[0] === "--json") {
    const stdin = await readStdin();
    const parsed = JSON.parse(stdin);
    for (const it of parsed) {
      if (typeof it === "string") items.push({ url: it });
      else if (it && it.url) items.push({ url: it.url, note: it.note });
    }
    return items;
  }
  if (args[0] === "--list") {
    const text = await readFile(args[1], "utf8");
    for (const line of text.split(/\r?\n/)) {
      const url = line.trim();
      if (url && !url.startsWith("#")) items.push({ url });
    }
    return items;
  }
  for (const url of args) if (url.trim()) items.push({ url: url.trim() });
  return items;
}

function readStdin() {
  return new Promise((res) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => res(data));
  });
}

async function main() {
  const [outDirArg, ...rest] = process.argv.slice(2);
  if (!outDirArg) {
    console.error("Usage: fetch-images.mjs <out-dir> <url|--list file|--json>");
    process.exit(1);
  }
  const outDir = resolve(outDirArg);
  await mkdir(outDir, { recursive: true });

  const inputs = await collectInputs(rest);
  if (inputs.length === 0) {
    console.error("No URLs provided.");
    process.exit(1);
  }

  // Load existing sources + hashes to dedupe across runs.
  const sourcesPath = join(outDir, "sources.json");
  let sources = [];
  if (existsSync(sourcesPath)) {
    try {
      sources = JSON.parse(await readFile(sourcesPath, "utf8"));
    } catch {
      sources = [];
    }
  }
  const seenUrls = new Set(sources.map((s) => s.url));
  const seenHashes = new Set(sources.map((s) => s.hash).filter(Boolean));

  // Next numeric index based on existing files.
  const existing = (await readdir(outDir)).filter((f) => /^\d{4}\./.test(f));
  let counter = existing.length;

  let ok = 0,
    skipped = 0,
    failed = 0;

  for (const { url, note } of inputs) {
    if (seenUrls.has(url)) {
      skipped++;
      continue;
    }
    try {
      const resp = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "Mozilla/5.0 (brand-shoot-prep image fetch)" },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
      if (seenHashes.has(hash)) {
        skipped++;
        continue;
      }
      const type = (resp.headers.get("content-type") || "").split(";")[0].trim();
      const ext = EXT_BY_TYPE[type] || extFromUrl(url) || "jpg";
      const name = String(++counter).padStart(4, "0") + "." + ext;
      await writeFile(join(outDir, name), buf);
      const entry = { file: name, url, hash, bytes: buf.length };
      if (note) entry.note = note;
      sources.push(entry);
      seenUrls.add(url);
      seenHashes.add(hash);
      ok++;
      console.log(`✓ ${name}  ${(buf.length / 1024).toFixed(0)}KB  ${url}`);
    } catch (e) {
      failed++;
      console.warn(`✗ ${url}  (${e.message})`);
    }
  }

  await writeFile(sourcesPath, JSON.stringify(sources, null, 2));
  console.log(
    `\nDone. saved=${ok} skipped=${skipped} failed=${failed}  -> ${outDir}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
