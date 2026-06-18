#!/usr/bin/env node
// Assemble a structured proposal.json from a client folder's markdown + approvals + sources.
// This is the machine-readable artifact the web sync (sync-to-web.mjs) ships to the site.
// Parsing lives here (the repo that owns the markdown format) so the web side never parses md.
//
// Usage:
//   node scripts/build-proposal-json.mjs clients/<slug>
//
// Output: clients/<slug>/proposal.json
//
// Image entries carry { file, note, status } only — sync-to-web.mjs uploads each file to
// Cloudinary and fills in { cloudinaryId, width, height } from the upload response.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { splitConcepts, loadApprovals } from "./build-page.mjs";

const IMG_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const readIf = async (p) => (existsSync(p) ? readFile(p, "utf8") : "");

// Pull a "- **Label:** value" bullet (value may wrap onto following indented lines).
function field(md, label) {
  const lines = md.split("\n");
  const re = new RegExp(`^\\s*-?\\s*\\*\\*${label}[^:*]*:\\*\\*\\s*(.*)$`, "i");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (!m) continue;
    const parts = [m[1]];
    // gather wrapped continuation lines (indented, not a new bullet/heading/blank)
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j];
      if (/^\s*$/.test(l) || /^\s*-\s+\*\*/.test(l) || /^#{1,6}\s/.test(l) || /^\s*-{3,}\s*$/.test(l)) break;
      parts.push(l.trim());
    }
    return parts.join(" ").trim();
  }
  return "";
}

// Strip markdown emphasis/code/links to plain-ish text for structured fields.
function clean(s) {
  return String(s)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseShotList(text) {
  const t = String(text);
  if (/\(\d+\)/.test(t)) {
    return t
      .split(/(?=\(\d+\))/)
      .map((s) => clean(s.replace(/^\(\d+\)\s*/, "").replace(/[;.]\s*$/, "")))
      .filter(Boolean);
  }
  return t
    .split(/;\s*/)
    .map((s) => clean(s.replace(/[;.]\s*$/, "")))
    .filter(Boolean);
}

function parseConcept(letter, md) {
  const titleMatch = md.match(/^##\s+Concept\s+[A-Z]\s*[—–-]\s*"?([^"\n]+)"?/m);
  const title = titleMatch ? clean(titleMatch[1].replace(/"$/, "")) : `Concept ${letter}`;
  const pitch = clean(field(md, "Pitch"));
  const paletteField = field(md, "Palette");
  const palette = [...new Set((paletteField.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()))];
  return {
    id: letter,
    title,
    pitch,
    why: clean(field(md, "Why it fits") || field(md, "Why")),
    mood: clean(field(md, "Mood")),
    palette,
    wardrobe: clean(field(md, "Wardrobe")),
    location: clean(field(md, "Location")),
    lighting: clean(field(md, "Lighting")),
    shotList: parseShotList(field(md, "Shot list")),
    poseDirection: clean(field(md, "Pose direction")),
    status: "pending",
  };
}

async function imageList(dir) {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => IMG_RE.test(f)).sort();
  let notes = {};
  const sp = join(dir, "sources.json");
  if (existsSync(sp)) {
    try {
      for (const s of JSON.parse(await readFile(sp, "utf8"))) if (s.file) notes[s.file] = s.note || "";
    } catch {}
  }
  return files.map((f) => ({ file: f, note: notes[f] || "" }));
}

// Parse a "## Color Palettes" (or "## Palety") section: lines like
//   - **Nokturno:** `#0c0d0f` `#3a3d42` `#8a8d92` `#c0392b` `#e6e4df`
function parsePalettes(md, statusMap) {
  const lines = (md || "").split("\n");
  let inSec = false;
  const out = [];
  for (const line of lines) {
    const h = line.match(/^##\s+(.*)$/);
    if (h) {
      inSec = /color palettes|palety|barevn/i.test(h[1]);
      continue;
    }
    if (!inSec) continue;
    const m = line.match(/^\s*-\s*\*\*([^:*]+):\*\*\s*(.+)$/);
    if (!m) continue;
    const colors = (m[2].match(/#[0-9a-fA-F]{6}/g) || []).map((c) => c.toLowerCase());
    if (!colors.length) continue;
    const name = clean(m[1]);
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `palette-${out.length + 1}`;
    out.push({ id, name, colors, status: statusMap?.[id] || "pending" });
  }
  return out;
}

export async function buildProposalJson(dir) {
  dir = resolve(dir);
  const slug = basename(dir);
  const briefMd = await readIf(join(dir, "brief.md"));
  const researchMd = await readIf(join(dir, "research.md"));
  const approachesMd = await readIf(join(dir, "approaches.md"));
  const approvals = (await loadApprovals(dir)) || {};

  const nameMatch = briefMd.match(/^#\s+(?:Brief\s+[—–-]\s+)?(.+)$/m) || briefMd.match(/\*\*Name:\*\*\s*(.+)/i);
  const name = nameMatch ? clean(nameMatch[1]) : slug;
  const localeMatch = briefMd.match(/\*\*Locale:\*\*\s*(\w+)/i);
  const locale = localeMatch && /en/i.test(localeMatch[1]) ? "en" : "cs";

  const grab = (label) => {
    const m = briefMd.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, "i"));
    if (!m) return undefined;
    const v = clean(m[1]).replace(/^_+|_+$/g, "").replace(/^\(|\)$/g, "").trim();
    return !v || /^none\b/i.test(v) || /none provided/i.test(v) ? undefined : v;
  };
  const dateMatch = briefMd.match(/\*\*Date:\*\*\s*([\d-]+)/i);

  const { concepts } = splitConcepts(approachesMd);
  const parsedConcepts = concepts.map((c) => {
    const concept = parseConcept(c.letter, c.md);
    concept.status = approvals?.concepts?.[c.letter] || "pending";
    return concept;
  });

  const applyStatus = (items, statusMap) =>
    items.map((it) => ({ ...it, status: statusMap?.[it.file] || "pending" }));

  const palettes = parsePalettes(approachesMd, approvals?.palettes);

  const moodboard = applyStatus(await imageList(join(dir, "assets", "moodboard")), approvals?.moodboard);
  const poses = applyStatus(await imageList(join(dir, "assets", "poses")), approvals?.poses);

  return {
    slug,
    name,
    locale,
    brief: {
      linkedin: grab("LinkedIn"),
      website: grab("Website"),
      notes: grab("Notes / goals") || grab("Notes"),
      date: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
    },
    research: researchMd,
    summary: grab("Summary"),
    concepts: parsedConcepts,
    palettes,
    moodboard,
    poses,
  };
}

async function cli() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("Usage: build-proposal-json.mjs clients/<slug>");
    process.exit(1);
  }
  const proposal = await buildProposalJson(dir);
  const outPath = join(resolve(dir), "proposal.json");
  await writeFile(outPath, JSON.stringify(proposal, null, 2));
  console.log(`✓ proposal.json written: ${outPath}`);
  console.log(
    `  concepts ${proposal.concepts.length} · palettes ${proposal.palettes.length} · moodboard ${proposal.moodboard.length} · poses ${proposal.poses.length} · locale ${proposal.locale}`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  cli().catch((e) => {
    console.error(e);
    process.exit(1);
  });
