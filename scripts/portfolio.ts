import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildStatus, MAX_PER_SHOOT, nfc, WEB_LIMIT } from "./portfolio/core";
import { listImages, listShoots, makePreview } from "./portfolio/drive";
import { configureCloudinary, listWebPhotos } from "./portfolio/cloud";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local je volitelný — proměnné mohou přijít z prostředí
}

async function driveRoot(): Promise<string> {
  const root = process.env.PORTFOLIO_DRIVE_ROOT;
  if (!root) throw new Error("Chybí PORTFOLIO_DRIVE_ROOT v .env.local (složka 'Guthovo fotky' na disku Google Drive for Desktop)");
  await fs.access(root).catch(() => {
    throw new Error(`PORTFOLIO_DRIVE_ROOT neexistuje: ${root} — běží Google Drive for Desktop?`);
  });
  return root;
}

async function status(): Promise<void> {
  const root = await driveRoot();
  configureCloudinary();
  const report = buildStatus(await listShoots(root), await listWebPhotos());

  console.log(`Web: ${report.total}/${WEB_LIMIT} fotek${report.total > WEB_LIMIT ? "  ⚠ nejstarší se nezobrazují" : ""}\n`);
  for (const { shoot, count } of report.rows) {
    const flag = count === 0 ? "  ← nic na webu" : count > MAX_PER_SHOOT ? "  ⚠ nad limit" : "";
    console.log(`${String(count).padStart(2)}  ${shoot}${flag}`);
  }
  if (report.violations.length) {
    console.log(`\n⚠ Nad limit ${MAX_PER_SHOOT}: ${report.violations.map((v) => `${v.shoot} (${v.count})`).join(", ")}`);
  }
  if (report.unknownShoots.length) {
    console.log(`\n⚠ Shoot není na Drive (přejmenovaný/smazaný?): ${report.unknownShoots.join(", ")}`);
  }
  if (report.untagged.length) {
    console.log(`\n⚠ ${report.untagged.length} fotek bez shootu (staré) — nahraď přes butler a smaž v /admin/fotky`);
  }
}

async function resolveShoot(root: string, shoot: string | undefined): Promise<string> {
  if (!shoot) throw new Error("Chybí název shootu");
  const match = (await listShoots(root)).find((s) => nfc(s) === nfc(shoot));
  if (!match) throw new Error(`Shoot „${shoot}“ na Drive není — zkontroluj \`status\``);
  return match;
}

async function previews(positional: string[], flags: Record<string, string | boolean | undefined>): Promise<void> {
  const root = await driveRoot();
  const shoot = await resolveShoot(root, positional[0]);
  const out = typeof flags.out === "string" ? flags.out : path.join(os.tmpdir(), "portfolio-previews");
  await fs.rm(out, { recursive: true, force: true });
  await fs.mkdir(out, { recursive: true });

  const map: Record<string, string> = {};
  const images = await listImages(path.join(root, shoot));
  for (const [i, src] of images.entries()) {
    const name = `${String(i + 1).padStart(3, "0")}.jpg`;
    try {
      await makePreview(src, path.join(out, name));
      map[name] = src;
    } catch (err) {
      console.warn(`⚠ přeskočeno ${src}: ${(err as Error).message}`);
    }
  }
  await fs.writeFile(path.join(out, "map.json"), JSON.stringify(map, null, 2));
  console.log(`${Object.keys(map).length}/${images.length} náhledů → ${out}`);
}

const commands: Record<string, (positional: string[], flags: Record<string, string | boolean | undefined>) => Promise<void>> = {
  status: () => status(),
  previews,
};

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      category: { type: "string" },
      "alt-cs": { type: "string" },
      "alt-en": { type: "string" },
      out: { type: "string" },
      force: { type: "boolean" },
    },
  });
  const [cmd, ...rest] = positionals;
  const run = commands[cmd ?? ""];
  if (!run) {
    console.error(`Použití: npm run portfolio -- <${Object.keys(commands).join("|")}> …`);
    process.exit(1);
  }
  await run(rest, values);
}

main().catch((err: Error) => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
