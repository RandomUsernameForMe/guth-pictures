// Shared helpers for the brand-shoot library (poses + moodboard refs).
// No deps; mirrors the self-contained style of the other scripts.
//
// Library lives at tools/brand-shoot-prep/library/:
//   manifest.json   — single source of truth (items + tags)
//   poses/          — AI loose-line sketches  (pose-0001.png ...)
//   moodboard/      — web refs + AI originals (mood-0001.jpg ...)

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const LIB_ROOT = resolve(HERE, "..", "library");
export const MANIFEST_PATH = join(LIB_ROOT, "manifest.json");
export const POSES_DIR = join(LIB_ROOT, "poses");
export const MOOD_DIR = join(LIB_ROOT, "moodboard");

// Controlled vocabulary — keep in sync with
// .claude/skills/brand-shoot-prep/references/tag-vocabulary.md
export const VOCAB = {
  emotion: ["confident","calm","warm","sharp","playful","authoritative","approachable","focused","bold","serene","dynamic","thoughtful","friendly","intense","relaxed","grounded","engaged"],
  shot: ["headshot","three-quarter","full","seated","hands","environmental"],
  setting: ["studio","office","stage","outdoor","home","urban","workshop","neutral-bg"],
  lighting: ["soft","hard","dark","bright","natural","mixed","dramatic","high-key","low-key","rim"],
  palette: ["neutral","warm","cool","dark","bright","earthy","monochrome","vibrant","muted"],
};

// Axes that hold a list of values. `shot` is single.
export const LIST_AXES = ["emotion", "setting", "lighting", "palette"];

export function dirFor(kind) {
  return kind === "pose" ? POSES_DIR : MOOD_DIR;
}

export function sha16(buf) {
  return createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

export async function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return { version: 1, items: [] };
  try {
    const m = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
    if (!Array.isArray(m.items)) m.items = [];
    return m;
  } catch {
    return { version: 1, items: [] };
  }
}

export async function writeManifest(m) {
  await mkdir(LIB_ROOT, { recursive: true });
  await writeFile(MANIFEST_PATH, JSON.stringify(m, null, 2));
}

// Next id like "pose-0007" / "mood-0012" based on existing items of that kind.
export function nextId(items, kind) {
  const prefix = kind === "pose" ? "pose" : "mood";
  let max = 0;
  for (const it of items) {
    const m = it.id?.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

// Validate/normalize a tags object against VOCAB. Returns { tags, warnings }.
// Unknown values are kept (so nothing is silently dropped) but warned about.
export function validateTags(raw = {}) {
  const tags = {};
  const warnings = [];
  for (const axis of LIST_AXES) {
    const vals = toList(raw[axis]);
    if (vals.length) {
      tags[axis] = vals;
      for (const v of vals) if (!VOCAB[axis].includes(v)) warnings.push(`unknown ${axis}: "${v}"`);
    }
  }
  if (raw.shot != null && raw.shot !== "") {
    const s = String(raw.shot).trim();
    tags.shot = s;
    if (!VOCAB.shot.includes(s)) warnings.push(`unknown shot: "${s}"`);
  }
  return { tags, warnings };
}

// Accept "a,b" string | ["a","b"] | "a" → ["a","b"].
export function toList(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Parse repeated/comma CLI flags into an object: --emotion a,b --shot full
export function parseFlags(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}
