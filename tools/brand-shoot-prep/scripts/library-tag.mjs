#!/usr/bin/env node
// Set / update tags on existing library items (e.g. after harvesting, which
// imports with needsTags:true). Replaces the given axes; clears needsTags once
// any tag is present. Validates against the vocabulary (warns on unknowns).
//
// Usage:
//   node scripts/library-tag.mjs <id> [<id> ...] \
//        --emotion confident,calm --shot three-quarter --setting studio \
//        --lighting soft --palette neutral
//   node scripts/library-tag.mjs pose-0004 --note "new direction note"
//
// Only axes you pass are changed; omitted axes are left as-is.

import { readManifest, writeManifest, validateTags, parseFlags } from "./_library.mjs";

async function main() {
  const f = parseFlags(process.argv.slice(2));
  const ids = f._;
  if (!ids.length) {
    console.error("Usage: library-tag.mjs <id> [<id>...] [--emotion a,b --shot x --setting a --lighting a --palette a --note ..]");
    process.exit(1);
  }

  // Only validate/apply axes that were actually passed.
  const passed = {};
  for (const axis of ["emotion", "shot", "setting", "lighting", "palette"])
    if (f[axis] != null && f[axis] !== true) passed[axis] = f[axis];
  const { tags: newTags, warnings } = validateTags(passed);
  for (const w of warnings) console.warn(`⚠ ${w}`);

  const manifest = await readManifest();
  const byId = Object.fromEntries(manifest.items.map((i) => [i.id, i]));

  let updated = 0;
  for (const id of ids) {
    const item = byId[id];
    if (!item) { console.warn(`✗ unknown id: ${id}`); continue; }
    item.tags = { ...(item.tags || {}), ...newTags };
    if (f.note != null && f.note !== true) item.note = f.note;
    if (Object.keys(item.tags).length) delete item.needsTags;
    updated++;
    console.log(`✓ ${id}  ${JSON.stringify(item.tags)}`);
  }

  await writeManifest(manifest);
  console.log(`\nUpdated ${updated}/${ids.length}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
