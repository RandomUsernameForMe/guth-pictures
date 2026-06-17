#!/usr/bin/env node
// Manage client access codes (codes.json). Codes are short + memorable passphrases like
// "WhiteSocksGuy". A code maps to a client folder; the client types it on the deployed gate
// to open their approved proposal. Matching is case/space/dash-insensitive.
//
// The proposal path is derived as sha256(salt + normalized-code), so the set of valid
// proposals is never listed publicly — only someone with a code can reach one.
//
// Usage:
//   node scripts/codes.mjs add <slug>                 # auto memorable code, e.g. WhiteSocksGuy
//   node scripts/codes.mjs add <slug> --code BlueFoxHat   # set your own memorable code
//   node scripts/codes.mjs list
//   node scripts/codes.mjs revoke <code>              # deactivate (any casing)
//   node scripts/codes.mjs enable <code>              # reactivate
//
// codes.json is kept out of git (it maps codes -> clients).

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const FILE = resolve("codes.json");

// Memorable word lists (Adjective + Noun + Noun -> "WhiteSocksGuy")
const ADJ = ["White","Black","Blue","Green","Red","Golden","Silver","Brave","Calm","Clever",
  "Happy","Lucky","Quiet","Rapid","Royal","Sharp","Sunny","Swift","Bold","Cosmic","Electric",
  "Mellow","Noble","Polar","Rustic","Velvet","Wild","Amber","Coral","Ivory","Jade","Crimson",
  "Misty","Stormy","Frosty","Hidden","Bright","Quick","Grand","Smooth"];
const NOUN1 = ["Socks","Hat","Coffee","Camera","Jacket","Boots","Glasses","Scarf","Lens","Watch",
  "Sneakers","Tie","Studio","Window","Mirror","Ladder","Compass","Anchor","Rocket","Lantern",
  "Pixel","Canvas","Marble","Maple","River","Mountain","Harbor","Meadow","Cactus","Ember"];
const NOUN2 = ["Guy","Fox","Owl","Wolf","Bear","Hawk","Lion","Otter","Panda","Tiger",
  "Heron","Falcon","Raven","Badger","Bison","Crane","Eagle","Lynx","Moose","Seal",
  "Maker","Pilot","Sailor","Nomad","Scout","Ranger","Artist","Runner","Diver","Builder"];

const pick = (arr) => arr[randomBytes(1)[0] % arr.length];
const generate = () => `${pick(ADJ)}${pick(NOUN1)}${pick(NOUN2)}`;

export const normalizeCode = (c) => String(c).toLowerCase().replace(/[^a-z0-9]/g, "");
export function tokenFor(salt, code) {
  return createHash("sha256").update(salt + normalizeCode(code)).digest("hex").slice(0, 24);
}

async function load() {
  if (!existsSync(FILE)) return { salt: randomBytes(16).toString("hex"), codes: {} };
  const j = JSON.parse(await readFile(FILE, "utf8"));
  if (!j.salt) j.salt = randomBytes(16).toString("hex");
  if (!j.codes) j.codes = {};
  return j;
}
const save = (j) => writeFile(FILE, JSON.stringify(j, null, 2));
const findKey = (j, code) => normalizeCode(code); // keys are stored normalized

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const arg = args[1];
  const customIdx = args.indexOf("--code");
  const custom = customIdx >= 0 ? args[customIdx + 1] : null;
  const j = await load();

  if (cmd === "add") {
    if (!arg) { console.error("Usage: codes.mjs add <slug> [--code Word]"); process.exit(1); }
    if (!existsSync(resolve("clients", arg))) { console.error(`No client folder: clients/${arg}`); process.exit(1); }
    let display = custom || generate();
    let key = normalizeCode(display);
    // avoid collision for auto-generated codes
    let tries = 0;
    while (!custom && j.codes[key] && tries++ < 20) { display = generate(); key = normalizeCode(display); }
    if (j.codes[key]) { console.error(`Code already in use: ${display}`); process.exit(1); }
    j.codes[key] = { slug: arg, display, active: true, created: new Date().toISOString() };
    await save(j);
    console.log(`✓ code for ${arg}:\n\n    ${display}\n`);
    console.log(`(typed any casing: "${display}", "${display.toLowerCase()}", "${display.replace(/([A-Z])/g, "-$1").replace(/^-/, "").toLowerCase()}" all work)`);
    console.log(`Proposal path after build-share + deploy: p/${tokenFor(j.salt, display)}/`);
    console.log(`Next: node scripts/build-share.mjs`);
    return;
  }
  if (cmd === "revoke" || cmd === "enable") {
    const key = findKey(j, arg);
    if (!arg || !j.codes[key]) { console.error(`Unknown code: ${arg}`); process.exit(1); }
    j.codes[key].active = cmd === "enable";
    await save(j);
    console.log(`✓ ${j.codes[key].display} ${cmd === "enable" ? "enabled" : "revoked"} (rebuild share to apply)`);
    return;
  }
  if (cmd === "list" || !cmd) {
    const rows = Object.values(j.codes);
    if (!rows.length) { console.log("No codes yet. Add one: node scripts/codes.mjs add <slug>"); return; }
    console.log("CODE                  CLIENT                          ACTIVE  CREATED");
    for (const c of rows)
      console.log(`${(c.display || "").padEnd(21)} ${c.slug.padEnd(31)} ${(c.active ? "yes" : "no").padEnd(6)} ${(c.created || "").slice(0, 10)}`);
    return;
  }
  console.error("Commands: add <slug> [--code Word] | list | revoke <code> | enable <code>");
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((e) => { console.error(e); process.exit(1); });
