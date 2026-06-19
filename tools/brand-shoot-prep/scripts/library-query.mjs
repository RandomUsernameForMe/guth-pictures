#!/usr/bin/env node
// Rank library items against a tag query. Used by the skill for auto-match;
// Claude makes the final semantic pick over this ranked list.
//
// Usage:
//   node scripts/library-query.mjs --kind pose --emotion confident,calm \
//        --shot three-quarter --setting studio --lighting soft --palette neutral \
//        [--limit 12] [--all]
//
// --all includes zero-score items (so you see the whole pool). Default: score>0.
// Output: JSON array on stdout, best match first.
//
// Score = weighted overlap. emotion/shot weigh most (they define the pose's read).

import { readManifest, toList, parseFlags } from "./_library.mjs";

const WEIGHTS = { emotion: 3, shot: 3, setting: 2, lighting: 1, palette: 1 };

function score(item, q) {
  let s = 0;
  const breakdown = {};
  for (const axis of ["emotion", "setting", "lighting", "palette"]) {
    const want = q[axis];
    if (!want.length) continue;
    const have = new Set(toList(item.tags?.[axis]));
    const hits = want.filter((v) => have.has(v)).length;
    if (hits) { s += hits * WEIGHTS[axis]; breakdown[axis] = hits; }
  }
  if (q.shot && item.tags?.shot === q.shot) { s += WEIGHTS.shot; breakdown.shot = 1; }
  return { s, breakdown };
}

async function main() {
  const f = parseFlags(process.argv.slice(2));
  const kind = f.kind === "pose" ? "pose" : f.kind === "moodboard" ? "moodboard" : null;
  const limit = parseInt(f.limit, 10) || 12;
  const q = {
    emotion: toList(f.emotion),
    shot: f.shot && f.shot !== true ? String(f.shot).trim() : null,
    setting: toList(f.setting),
    lighting: toList(f.lighting),
    palette: toList(f.palette),
  };

  const manifest = await readManifest();
  let pool = manifest.items;
  if (kind) pool = pool.filter((i) => i.kind === kind);

  const ranked = pool
    .map((i) => { const { s, breakdown } = score(i, q); return { ...i, _score: s, _match: breakdown }; })
    .filter((i) => f.all === true || i._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ id, kind, file, tags, note, _score, _match, needsTags }) =>
      ({ id, kind, file, tags, note, score: _score, match: _match, ...(needsTags ? { needsTags } : {}) }));

  console.log(JSON.stringify(ranked, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
