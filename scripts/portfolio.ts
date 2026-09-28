import fs from "node:fs/promises";
import { parseArgs } from "node:util";
import { buildStatus, MAX_PER_SHOOT, WEB_LIMIT } from "./portfolio/core";
import { listShoots } from "./portfolio/drive";
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

const commands: Record<string, (positional: string[], flags: Record<string, string | boolean | undefined>) => Promise<void>> = {
  status: () => status(),
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
