#!/usr/bin/env node
// Push a built proposal.json to the guth-pictures website: upload its images to Cloudinary
// (signed REST, no SDK — keeps this repo dependency-free) and POST the metadata to the
// site's ingest API. Re-running is safe: image public_ids are content-derived (idempotent)
// and the web side preserves any approval state set in the admin.
//
// Usage:
//   node scripts/sync-to-web.mjs <slug>            # builds proposal.json if missing, then syncs
//   node scripts/sync-to-web.mjs clients/<slug>
//
// Env (put in brand-shoot-prep/.env or export):
//   WEB_URL                 default http://localhost:3000
//   PROPOSAL_SYNC_SECRET    must match the web env
//   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { buildProposalJson } from "./build-proposal-json.mjs";

// Minimal .env loader (no dependency).
async function loadEnv() {
  const p = resolve(".env");
  if (!existsSync(p)) return;
  for (const line of (await readFile(p, "utf8")).split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const sha1Hex = (s) => createHash("sha1").update(s).digest("hex");

async function uploadImage(absPath, folder) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !apiKey || !apiSecret) throw new Error("Missing CLOUDINARY_* env vars");

  const bytes = await readFile(absPath);
  // Content-derived, hard-to-guess id → idempotent re-uploads + unlisted delivery path.
  const publicId = createHash("sha256").update(bytes).digest("hex").slice(0, 20);
  const timestamp = Math.round(Date.now() / 1000);

  // Sign the alphabetically-sorted signable params, then append the api_secret.
  const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = sha1Hex(toSign + apiSecret);

  const form = new FormData();
  form.append("file", new Blob([bytes]), basename(absPath));
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("public_id", publicId);
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return { cloudinaryId: j.public_id, width: j.width, height: j.height };
}

async function uploadBoard(dir, board, items) {
  const folder = `proposals/${basename(dir)}/${board}`;
  const out = [];
  for (const it of items) {
    const abs = join(dir, "assets", board === "moodboard" ? "moodboard" : "poses", it.file);
    if (!existsSync(abs)) {
      console.warn(`  ! missing ${abs} — skipped`);
      continue;
    }
    try {
      const up = await uploadImage(abs, folder);
      out.push({ ...up, note: it.note || undefined, status: it.status || "pending" });
      process.stdout.write(`  ↑ ${board}/${it.file} → ${up.cloudinaryId}\n`);
    } catch (e) {
      console.warn(`  ! ${board}/${it.file}: ${e.message}`);
    }
  }
  return out;
}

async function main() {
  await loadEnv();
  let arg = process.argv[2];
  if (!arg) {
    console.error("Usage: sync-to-web.mjs <slug>");
    process.exit(1);
  }
  const dir = resolve(arg.includes("/") ? arg : join("clients", arg));
  if (!existsSync(dir)) {
    console.error(`No client folder: ${dir}`);
    process.exit(1);
  }

  const webUrl = (process.env.WEB_URL || "http://localhost:3000").replace(/\/$/, "");
  const secret = process.env.PROPOSAL_SYNC_SECRET;
  if (!secret) {
    console.error("Missing PROPOSAL_SYNC_SECRET");
    process.exit(1);
  }

  console.log(`Building proposal.json for ${basename(dir)}…`);
  const proposal = await buildProposalJson(dir);

  console.log("Uploading images to Cloudinary…");
  const moodboard = await uploadBoard(dir, "moodboard", proposal.moodboard);
  const poses = await uploadBoard(dir, "poses", proposal.poses);

  const cover = moodboard.find((i) => i.status === "approved")?.cloudinaryId || moodboard[0]?.cloudinaryId;

  const payload = {
    slug: proposal.slug,
    name: proposal.name,
    locale: proposal.locale,
    brief: proposal.brief,
    research: proposal.research,
    concepts: proposal.concepts,
    moodboard,
    poses,
    coverImageId: cover,
  };

  console.log(`Posting to ${webUrl}/api/proposals/sync…`);
  const res = await fetch(`${webUrl}/api/proposals/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Sync failed ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const j = await res.json();
  console.log(`✓ synced "${proposal.name}" (${j.slug})`);
  console.log(`  Client URL: ${webUrl}/${proposal.locale}/navrh/${proposal.slug}`);
  console.log(`  Set a password + finalize in the admin: ${webUrl}/admin/navrhy/${proposal.slug}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
