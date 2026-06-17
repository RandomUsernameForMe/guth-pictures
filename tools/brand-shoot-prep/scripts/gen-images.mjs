#!/usr/bin/env node
// OPTIONAL: generate original images with Gemini (Nano Banana / image model).
// Reads GEMINI_API_KEY from the environment. If absent, it no-ops with a clear
// message so the skill can fall back to Canva generate-design.
//
// Usage:
//   GEMINI_API_KEY=... node scripts/gen-images.mjs <out-dir> "<prompt>" [--n 3] [--prefix gen] [--model gemini-2.5-flash-image]
//
// Saves <prefix>-0001.png, ... into out-dir. Records prompts to gen-sources.json.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

function parseArgs(argv) {
  const [outDir, prompt, ...rest] = argv;
  const opts = { outDir, prompt, n: 3, prefix: "gen", model: "gemini-2.5-flash-image" };
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i]?.replace(/^--/, "");
    if (key === "n") opts.n = parseInt(rest[i + 1], 10) || 1;
    else if (key) opts[key] = rest[i + 1];
  }
  return opts;
}

async function generateOne(model, key, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }
  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) throw new Error("no image in response");
  return Buffer.from(img.inlineData.data, "base64");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const key = process.env.GEMINI_API_KEY;

  if (!opts.outDir || !opts.prompt) {
    console.error('Usage: gen-images.mjs <out-dir> "<prompt>" [--n 3] [--prefix gen]');
    process.exit(1);
  }

  if (!key) {
    console.log(
      "GEMINI_API_KEY not set — skipping AI image generation.\n" +
        "Fall back to Canva generate-design, or set GEMINI_API_KEY to enable this script."
    );
    process.exit(0); // soft exit: not an error, just a no-op
  }

  const outDir = resolve(opts.outDir);
  await mkdir(outDir, { recursive: true });

  const recPath = join(outDir, "gen-sources.json");
  let rec = [];
  if (existsSync(recPath)) {
    try {
      rec = JSON.parse(await readFile(recPath, "utf8"));
    } catch {}
  }

  let ok = 0;
  for (let i = 0; i < opts.n; i++) {
    const name = `${opts.prefix}-${String(rec.length + 1).padStart(4, "0")}.png`;
    try {
      const buf = await generateOne(opts.model, key, opts.prompt);
      await writeFile(join(outDir, name), buf);
      rec.push({ file: name, prompt: opts.prompt, model: opts.model });
      ok++;
      console.log(`✓ ${name}  (${(buf.length / 1024).toFixed(0)}KB)`);
    } catch (e) {
      console.warn(`✗ generation failed: ${e.message}`);
    }
  }

  await writeFile(recPath, JSON.stringify(rec, null, 2));
  console.log(`\nDone. generated=${ok}/${opts.n}  -> ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
