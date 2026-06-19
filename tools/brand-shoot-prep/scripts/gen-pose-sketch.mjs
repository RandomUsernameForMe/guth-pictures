#!/usr/bin/env node
// Generate loose line/contour pose SKETCHES into the library via Gemini.
// One locked style prefix → the whole pose library stays visually consistent.
// Each sketch is tagged and appended to library/manifest.json (source: "ai").
//
// Needs GEMINI_API_KEY (same as gen-images.mjs). No key → clean no-op exit 0.
//
// Usage:
//   node scripts/gen-pose-sketch.mjs --emotion confident --shot three-quarter \
//        [--setting studio] [--palette neutral] [--note "weight on back foot"] \
//        [--n 2] [--model gemini-2.5-flash-image]

import { readManifest, writeManifest, parseFlags, toList } from "./_library.mjs";
import { addItem } from "./library-add.mjs";

// LOCKED style — do not vary per call. This is what keeps the library consistent.
const STYLE_PREFIX =
  "Minimal loose single-weight black contour line drawing of one person on a clean " +
  "plain white background. Gesture-sketch / editorial fashion-illustration style. " +
  "No shading, no fill, no color, no background detail. Expressive, confident, " +
  "economical line. Whole pose clearly readable.";

const SHOT_FRAMING = {
  headshot: "head-and-shoulders framing",
  "three-quarter": "three-quarter (knees-up) framing",
  full: "full-body framing, head to feet",
  seated: "seated figure, full pose visible",
  hands: "close framing emphasizing hands and gesture",
  environmental: "figure within a suggested minimal environment",
};

function buildPrompt({ emotion, shot, setting, note }) {
  const emo = toList(emotion).join(", ");
  const parts = [STYLE_PREFIX];
  if (shot) parts.push(SHOT_FRAMING[shot] || `${shot} framing`);
  if (emo) parts.push(`posture and body language conveying ${emo}`);
  if (setting) parts.push(`subtle ${toList(setting).join("/")} context, kept minimal`);
  if (note) parts.push(note);
  return parts.join(". ") + ".";
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
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  const data = await resp.json();
  const img = (data?.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
  if (!img) throw new Error("no image in response");
  return Buffer.from(img.inlineData.data, "base64");
}

async function main() {
  const f = parseFlags(process.argv.slice(2));
  const key = process.env.GEMINI_API_KEY;
  const n = parseInt(f.n, 10) || 1;
  const model = f.model || "gemini-2.5-flash-image";

  if (!f.emotion && !f.shot) {
    console.error("Usage: gen-pose-sketch.mjs --emotion <e> --shot <s> [--setting --palette --note --n]");
    process.exit(1);
  }
  if (!key) {
    console.log("GEMINI_API_KEY not set — skipping sketch generation (set it in .env to enable).");
    process.exit(0);
  }

  const prompt = buildPrompt(f);
  const tags = { emotion: f.emotion, shot: f.shot, setting: f.setting, lighting: f.lighting, palette: f.palette };
  const manifest = await readManifest();

  let ok = 0;
  for (let i = 0; i < n; i++) {
    try {
      const buf = await generateOne(model, key, prompt);
      const { item, deduped } = await addItem({
        kind: "pose", buf, ext: "png", tags, note: f.note, source: "ai", prompt, manifest,
      });
      console.log(`${deduped ? "↷ deduped" : "✓"} ${item.id}  (${(buf.length / 1024).toFixed(0)}KB)`);
      if (!deduped) ok++;
    } catch (e) {
      console.warn(`✗ generation failed: ${e.message}`);
    }
  }
  await writeManifest(manifest);
  console.log(`\nDone. added=${ok}/${n}  prompt: ${prompt.slice(0, 80)}…`);
}

main().catch((e) => { console.error(e); process.exit(1); });
