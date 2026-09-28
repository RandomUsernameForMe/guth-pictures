# Portfolio Butler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLI skript + Claude skill `/portfolio`, který porovná shooty na Google Drive s fotkami v Cloudinary `portfolio`, pomůže vybrat nejlepší fotky a nahraje je s vazbou na shoot (max 2 na shoot).

**Architecture:** Čisté funkce v `scripts/portfolio/core.ts` (testované vitestem), I/O ve dvou tenkých modulech (`drive.ts` = lokální disk Drive for Desktop + sharp, `cloud.ts` = Cloudinary SDK), CLI dispatcher `scripts/portfolio.ts` s příkazy `status | previews | upload`. Skill jen popisuje konverzační flow a volá CLI. Web se nemění.

**Tech Stack:** TypeScript, `tsx`, `node:util` `parseArgs`, `sharp` 0.34, `cloudinary` v2 SDK, vitest.

**Spec:** `docs/superpowers/specs/2026-09-28-portfolio-butler-design.md`

## Global Constraints

- Shoot = složka nejvyšší úrovně v `PORTFOLIO_DRIVE_ROOT` (včetně podsložek); ID shootu = název té složky, normalizovaný na NFC.
- Pravidlo: max **2** fotky na shoot (`MAX_PER_SHOOT = 2`); upload nad limit odmítnout bez `--force`.
- Cloudinary složka `portfolio`; context klíče `shoot`, `category`, `alt_cs`, `alt_en`. Kategorie: `portréty` | `svatby` | `larpy`.
- Web zobrazuje max **50** fotek (`lib/cloudinary.ts`) → `status` hlásí celkový počet vůči 50.
- Náhledy: delší strana 800 px. Upload: delší strana max 3000 px, JPEG q90 (originály mají 8–12 MB, free Cloudinary limit je 10 MB na obrázek).
- Skripty neimportují `lib/cloudinary.ts` (obsahuje `import "server-only"`, mimo Next hází) → Cloudinary se konfiguruje přímo ve `scripts/portfolio/cloud.ts`.
- Ověřeno 2026-09-28: Drive for Desktop = `F:/My Drive/Guthovo fotky` (48 složek shootů + volné soubory v rootu, které se ignorují). `/` z názvu na Drive je lokálně mezera (`2026 9 - Kamča`). Náhled z nestaženého souboru trvá ~4 s (stahuje se 8–12 MB) → `previews` shootu se 100 fotkami ≈ 6 min.
- Starší fotky na webu se k shootům **nepřiřazují** (rozhodnutí uživatele): nahrají se znovu přes butler a staré smaže uživatel v `/admin/fotky`. Opětovný upload ztratí tag `selected_work` (★ Selected Work na homepage + pool pro stories), takže ★ se po přenahrání označí znovu v adminu.
- Každý commit: nejdřív `npx tsc --noEmit` bez chyb, `CHANGELOG.md` v `git add` (jeden záznam `## [2026-09-28] - Portfolio Butler`, každý task přidá odrážku). Stageovat jen vyjmenované soubory. V repu leží nesouvisející untracked soubory, nikdy nepoužívej `git add -A`.
- Větev `feat/portfolio-butler`; na `main` nepushovat.

## Review Focus

1. **Diakritika NFC vs NFD**: název složky z disku a hodnota v Cloudinary se musí shodovat i při jiné Unicode normalizaci (`Kamča`). Pokryto testy `shootFromPath` a `buildStatus` (Task 1).
2. **Řazení měsíců**: `2026 10` musí být novější než `2026 9`, `2026 01` = leden. Pokryto testem `sortShoots` (Task 1).
3. **Soubor mimo shoot**: upload souboru přímo v rootu nebo mimo root musí selhat, ne nahrát fotku bez shootu. Pokryto testem `shootFromPath` (Task 1) + kontrolou v Task 4.
4. **Přejmenovaná složka na Drive**: fotka na webu se starým `shoot` se nesmí tiše ztratit a musí se objevit jako „neznámý shoot“. Pokryto testem `buildStatus` (Task 1).
5. **Nečitelný / online-only soubor**: `previews` soubor přeskočí s varováním a nespadnou. Ručně ověřeno v Task 3.

---

### Task 1: Čisté funkce (`core.ts`)

**Files:**
- Create: `scripts/portfolio/core.ts`
- Test: `scripts/__tests__/portfolio-core.test.ts`
- Modify: `CHANGELOG.md` (nový záznam nahoře)

**Interfaces:**
- Produces:
  - `MAX_PER_SHOOT = 2`, `WEB_LIMIT = 50`
  - `CATEGORIES`, `type Category = "portréty" | "svatby" | "larpy"`, `isCategory(v: unknown): v is Category`
  - `type WebPhoto = { publicId: string; shoot?: string }`
  - `nfc(s: string): string`
  - `shootFromPath(root: string, filePath: string): string | null`
  - `sortShoots(names: string[]): string[]` (nejnovější první)
  - `countByShoot(photos: WebPhoto[]): Map<string, number>`
  - `canAdd(photos: WebPhoto[], shoot: string, max?: number): boolean`
  - `type StatusReport` + `buildStatus(driveShoots: string[], photos: WebPhoto[], max?: number): StatusReport`

- [ ] **Step 1: Napiš failing testy**

`scripts/__tests__/portfolio-core.test.ts`:

```ts
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  shootFromPath, sortShoots, countByShoot, canAdd, buildStatus, isCategory,
} from "../portfolio/core";

const root = path.join("drive", "Guthovo fotky");

describe("shootFromPath", () => {
  it("vrátí složku nejvyšší úrovně", () => {
    expect(shootFromPath(root, path.join(root, "2026 9 - Kamča", "A1.jpg"))).toBe("2026 9 - Kamča");
  });
  it("podsložka patří k nadřazenému shootu", () => {
    expect(shootFromPath(root, path.join(root, "2025 6 - Divoké focení", "Druidka", "x.jpg")))
      .toBe("2025 6 - Divoké focení");
  });
  it("soubor přímo v rootu nemá shoot", () => {
    expect(shootFromPath(root, path.join(root, "x.jpg"))).toBeNull();
  });
  it("soubor mimo root nemá shoot", () => {
    expect(shootFromPath(root, path.join("jinde", "a", "x.jpg"))).toBeNull();
  });
  it("normalizuje NFD na NFC", () => {
    const nfd = "Kamc\u030Ca";
    expect(shootFromPath(root, path.join(root, nfd, "x.jpg"))).toBe("Kamča");
  });
});

describe("sortShoots", () => {
  it("řadí podle roku a měsíce sestupně, nečíselné na konec", () => {
    expect(sortShoots(["2026 9 - A", "Akano", "2026 10 - B", "2026 01 - C", "2025 12 - D"]))
      .toEqual(["2026 10 - B", "2026 9 - A", "2026 01 - C", "2025 12 - D", "Akano"]);
  });
});

describe("countByShoot / canAdd", () => {
  const photos = [
    { publicId: "p1", shoot: "A" },
    { publicId: "p2", shoot: "A" },
    { publicId: "p3", shoot: "B" },
    { publicId: "p4" },
  ];
  it("počítá fotky na shoot a ignoruje bez shootu", () => {
    expect(Object.fromEntries(countByShoot(photos))).toEqual({ A: 2, B: 1 });
  });
  it("canAdd hlídá limit", () => {
    expect(canAdd(photos, "A")).toBe(false);
    expect(canAdd(photos, "B")).toBe(true);
    expect(canAdd(photos, "C")).toBe(true);
  });
});

describe("buildStatus", () => {
  it("najde porušení, fotky bez shootu a neznámé shooty (i přes NFD)", () => {
    const report = buildStatus(
      ["Kamča", "B"],
      [
        { publicId: "1", shoot: "Kamc\u030Ca" },
        { publicId: "2", shoot: "B" }, { publicId: "3", shoot: "B" }, { publicId: "4", shoot: "B" },
        { publicId: "5", shoot: "Smazaný" },
        { publicId: "6" },
      ],
    );
    expect(report.rows).toEqual([{ shoot: "Kamča", count: 1 }, { shoot: "B", count: 3 }]);
    expect(report.violations).toEqual([{ shoot: "B", count: 3 }]);
    expect(report.untagged).toEqual(["6"]);
    expect(report.unknownShoots).toEqual(["Smazaný"]);
    expect(report.total).toBe(6);
  });
});

describe("isCategory", () => {
  it("přijme jen známé kategorie", () => {
    expect(isCategory("larpy")).toBe(true);
    expect(isCategory("krajina")).toBe(false);
  });
});
```

- [ ] **Step 2: Spusť, ověř, že selže**

Run: `npx vitest run scripts/__tests__/portfolio-core.test.ts`
Expected: FAIL, `Failed to resolve import "../portfolio/core"`

- [ ] **Step 3: Implementace**

`scripts/portfolio/core.ts`:

```ts
import path from "node:path";

export const MAX_PER_SHOOT = 2;
export const WEB_LIMIT = 50;

export const CATEGORIES = ["portréty", "svatby", "larpy"] as const;
export type Category = (typeof CATEGORIES)[number];

export type WebPhoto = { publicId: string; shoot?: string };

export const nfc = (s: string) => s.normalize("NFC");

export function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
}

export function shootFromPath(root: string, filePath: string): string | null {
  const rel = path.relative(path.resolve(root), path.resolve(filePath));
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const parts = rel.split(/[\\/]/);
  return parts.length > 1 ? nfc(parts[0]) : null;
}

function shootKey(name: string): number {
  const m = name.match(/^(\d{4})\D+(\d{1,2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : -1;
}

export function sortShoots(names: string[]): string[] {
  return [...names].sort((a, b) => shootKey(b) - shootKey(a) || a.localeCompare(b, "cs"));
}

export function countByShoot(photos: WebPhoto[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of photos) {
    if (!p.shoot) continue;
    const key = nfc(p.shoot);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function canAdd(photos: WebPhoto[], shoot: string, max = MAX_PER_SHOOT): boolean {
  return (countByShoot(photos).get(nfc(shoot)) ?? 0) < max;
}

export type StatusReport = {
  rows: { shoot: string; count: number }[];
  violations: { shoot: string; count: number }[];
  untagged: string[];
  unknownShoots: string[];
  total: number;
};

export function buildStatus(driveShoots: string[], photos: WebPhoto[], max = MAX_PER_SHOOT): StatusReport {
  const counts = countByShoot(photos);
  const known = new Set(driveShoots.map(nfc));
  return {
    rows: driveShoots.map((s) => ({ shoot: nfc(s), count: counts.get(nfc(s)) ?? 0 })),
    violations: [...counts].filter(([, c]) => c > max).map(([shoot, count]) => ({ shoot, count })),
    untagged: photos.filter((p) => !p.shoot).map((p) => p.publicId),
    unknownShoots: [...counts.keys()].filter((s) => !known.has(s)),
    total: photos.length,
  };
}
```

- [ ] **Step 4: Spusť testy, ověř PASS**

Run: `npx vitest run scripts/__tests__/portfolio-core.test.ts`
Expected: PASS, všechny testy zelené

- [ ] **Step 5: tsc + CHANGELOG + commit**

Na začátek `CHANGELOG.md` přidej:

```markdown
## [2026-09-28] - Portfolio Butler

- `scripts/portfolio/core.ts`: čisté funkce (shoot z cesty, řazení shootů, limit 2 na shoot, status report).
```

```bash
npx tsc --noEmit
git add scripts/portfolio/core.ts scripts/__tests__/portfolio-core.test.ts CHANGELOG.md
git commit -m "feat(portfolio): core functions for portfolio butler"
```

---

### Task 2: I/O moduly + příkaz `status`

**Files:**
- Create: `scripts/portfolio/drive.ts`, `scripts/portfolio/cloud.ts`, `scripts/portfolio.ts`
- Modify: `package.json` (devDependency `sharp`, skript `portfolio`), `.env.example`, `CHANGELOG.md`

**Interfaces:**
- Consumes: `nfc`, `sortShoots`, `buildStatus`, `WEB_LIMIT`, `MAX_PER_SHOOT`, `Category`, `WebPhoto` (Task 1)
- Produces:
  - `drive.ts`: `listShoots(root): Promise<string[]>` (surové názvy složek, seřazené), `listImages(dir): Promise<string[]>` (absolutní cesty, rekurzivně), `makePreview(src, out): Promise<void>`, `webVersion(src): Promise<Buffer>`
  - `cloud.ts`: `configureCloudinary(): void`, `listWebPhotos(): Promise<WebPhoto[]>`, `uploadPhoto(buf, ctx): Promise<string>`
  - `scripts/portfolio.ts`: `driveRoot(): Promise<string>`, tabulka `commands`

- [ ] **Step 1: Závislost a env**

`sharp` je v `node_modules` jen tranzitivně přes Next. Zapiš ho explicitně ve stejné verzi:

```bash
npm i -D sharp@0.34.5
```

Na konec `.env.example` přidej:

```
# Portfolio butler (scripts/portfolio.ts) — cesta ke složce "Guthovo fotky" na disku Google Drive for Desktop
PORTFOLIO_DRIVE_ROOT=
```

- [ ] **Step 2: `scripts/portfolio/drive.ts`**

```ts
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { sortShoots } from "./core";

const IMAGE_RE = /\.(jpe?g|png|tiff?|webp)$/i;

export async function listShoots(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return sortShoots(entries.filter((e) => e.isDirectory()).map((e) => e.name));
}

export async function listImages(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir, { recursive: true });
  return files.filter((f) => IMAGE_RE.test(f)).sort().map((f) => path.join(dir, f));
}

export async function makePreview(src: string, out: string): Promise<void> {
  await sharp(src).rotate().resize(800, 800, { fit: "inside" }).jpeg({ quality: 80 }).toFile(out);
}

export async function webVersion(src: string): Promise<Buffer> {
  return sharp(src)
    .rotate()
    .resize(3000, 3000, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 90 })
    .toBuffer();
}
```

- [ ] **Step 3: `scripts/portfolio/cloud.ts`**

```ts
import { v2 as cloudinary } from "cloudinary";
import type { Category, WebPhoto } from "./core";

const FOLDER = "portfolio";

export function configureCloudinary(): void {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Chybí CLOUDINARY_* v .env.local — spusť `vercel env pull .env.local`");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

type Resource = { public_id: string; context?: { shoot?: string } };

export async function listWebPhotos(): Promise<WebPhoto[]> {
  // ponytail: jedna stránka (500); přidej next_cursor, kdyby portfolio někdy přerostlo
  const res = await cloudinary.search
    .expression(`folder:${FOLDER}`)
    .with_field("context")
    .max_results(500)
    .execute();
  return res.resources.map((r: Resource) => ({ publicId: r.public_id, shoot: r.context?.shoot }));
}

export async function uploadPhoto(
  buf: Buffer,
  ctx: { shoot: string; category: Category; alt_cs: string; alt_en: string },
): Promise<string> {
  const result = await new Promise<{ public_id: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: FOLDER, context: ctx }, (err, r) => (err || !r ? reject(err) : resolve(r)))
      .end(buf);
  });
  return result.public_id;
}
```

- [ ] **Step 4: `scripts/portfolio.ts` se `status`**

```ts
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
```

Do `package.json` `scripts` přidej: `"portfolio": "tsx scripts/portfolio.ts"`.

- [ ] **Step 5: Ruční ověření na reálných datech**

Předpoklady: běží Google Drive for Desktop, existuje `.env.local` (`vercel env pull .env.local`) a v něm je doplněné `PORTFOLIO_DRIVE_ROOT`.

1. `ls "<PORTFOLIO_DRIVE_ROOT>"` → složky ve tvaru `2026 9 - Kamča` (ověřeno 2026-09-28).
2. `npm run portfolio -- status`
   Expected: řádek `Web: N/50 fotek`, seznam všech shootů od nejnovějšího, u všech `0` (zatím nikdo nemá `shoot`) a hláška `N fotek bez shootu`.
3. `npm run portfolio -- nesmysl` → Expected: `Použití: …`, exit 1.
4. Bez `PORTFOLIO_DRIVE_ROOT` → Expected: `✖ Chybí PORTFOLIO_DRIVE_ROOT…`.

- [ ] **Step 6: tsc + CHANGELOG + commit**

Do záznamu `Portfolio Butler` v `CHANGELOG.md` přidej odrážku:
`- \`npm run portfolio -- status\`: přehled shootů na Drive vs. fotky na webu, porušení limitu, fotky bez shootu.`

```bash
npx tsc --noEmit
git add scripts/portfolio/drive.ts scripts/portfolio/cloud.ts scripts/portfolio.ts package.json package-lock.json .env.example CHANGELOG.md
git commit -m "feat(portfolio): status command"
```

---

### Task 3: Příkaz `previews`

**Files:**
- Modify: `scripts/portfolio.ts`, `CHANGELOG.md`

**Interfaces:**
- Consumes: `listShoots`, `listImages`, `makePreview` (Task 2), `nfc` (Task 1)
- Produces: CLI `previews "<shoot>" [--out <dir>]` → složka s `001.jpg…` a `map.json` (`{ "001.jpg": "<absolutní cesta k originálu>" }`); výchozí `--out` = `<os.tmpdir()>/portfolio-previews`

- [ ] **Step 1: Implementace**

Do `scripts/portfolio.ts` přidej importy `os`, `path`, `nfc` a `listImages`, `makePreview` a funkci:

```ts
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
```

Do `commands` přidej `previews`.

- [ ] **Step 2: Ruční ověření**

1. `npm run portfolio -- previews "<lokální název Kamča shootu>"`
   Expected: `N/N náhledů → …\portfolio-previews`; `001.jpg` má delší stranu 800 px (`npx tsx -e "import s from 'sharp';s('<out>/001.jpg').metadata().then(m=>console.log(m.width,m.height))"`).
2. Shoot s podsložkami (`Divoké focení`) → počet náhledů = součet fotek ze všech podsložek.
3. `npm run portfolio -- previews "neexistuje"` → Expected: `✖ Shoot „neexistuje“ na Drive není…`.
4. Do kopie shootu ve scratchpadu podstrč poškozený soubor (`echo x > bad.jpg`), spusť `previews` s `PORTFOLIO_DRIVE_ROOT` na scratchpad → Expected: `⚠ přeskočeno …bad.jpg`, zbytek projde, exit 0.

- [ ] **Step 3: tsc + CHANGELOG + commit**

Odrážka: `- \`previews\`: náhledy 800 px z celého shootu (včetně podsložek) + map.json.`

```bash
npx tsc --noEmit
git add scripts/portfolio.ts CHANGELOG.md
git commit -m "feat(portfolio): previews command"
```

---

### Task 4: Příkaz `upload`

**Files:**
- Modify: `scripts/portfolio.ts`, `CHANGELOG.md`

**Interfaces:**
- Consumes: `shootFromPath`, `canAdd`, `isCategory`, `CATEGORIES`, `MAX_PER_SHOOT` (Task 1), `webVersion` (Task 2), `listWebPhotos`, `uploadPhoto` (Task 2)
- Produces: CLI `upload "<cesta k originálu>" --category <kat> --alt-cs "<text>" --alt-en "<text>" [--force]`. Shoot se odvodí z cesty (spec měl `--shoot`, cesta je jediný zdroj pravdy a vyloučí překlep).

- [ ] **Step 1: Implementace**

```ts
async function upload(positional: string[], flags: Record<string, string | boolean | undefined>): Promise<void> {
  const root = await driveRoot();
  const file = positional[0];
  if (!file) throw new Error("Chybí cesta k fotce");
  const shoot = shootFromPath(root, file);
  if (!shoot) throw new Error(`Fotka není ve složce shootu pod ${root}`);
  if (!isCategory(flags.category)) throw new Error(`--category musí být jedna z: ${CATEGORIES.join(", ")}`);
  const altCs = flags["alt-cs"];
  const altEn = flags["alt-en"];
  if (typeof altCs !== "string" || !altCs.trim() || typeof altEn !== "string" || !altEn.trim()) {
    throw new Error("Chybí --alt-cs nebo --alt-en");
  }

  configureCloudinary();
  if (!canAdd(await listWebPhotos(), shoot) && !flags.force) {
    throw new Error(`Shoot „${shoot}“ už má ${MAX_PER_SHOOT} fotky na webu (přepiš --force)`);
  }
  const publicId = await uploadPhoto(await webVersion(file), {
    shoot,
    category: flags.category,
    alt_cs: altCs.trim(),
    alt_en: altEn.trim(),
  });
  console.log(`✔ ${publicId}  (${shoot})`);
}
```

Doplň importy (`shootFromPath`, `canAdd`, `isCategory`, `CATEGORIES`, `webVersion`, `uploadPhoto`) a přidej `upload` do `commands`.

- [ ] **Step 2: Ruční ověření (validace bez uploadu)**

1. Soubor mimo shoot (`upload C:\x.jpg --category portréty --alt-cs a --alt-en b`) → `✖ Fotka není ve složce shootu…`
2. `--category krajina` → `✖ --category musí být jedna z: portréty, svatby, larpy`
3. Bez `--alt-en` → `✖ Chybí --alt-cs nebo --alt-en`

- [ ] **Step 3: Ruční ověření (reálný upload, se souhlasem uživatele)**

Na **výslovný pokyn uživatele** nahraj jednu jím vybranou fotku. Pak `status` → u shootu `1`. Na webu (`/cs/portfolio`, cache až 5 min) se fotka objeví. Pokud testovací fotka na webu zůstat nemá, uživatel ji smaže v `/admin/fotky`.

- [ ] **Step 4: tsc + CHANGELOG + commit**

Odrážka: `- \`upload\`: zmenšení na 3000 px, upload do portfolio s context shoot/category/alt, odmítne 3. fotku ze shootu.`

```bash
npx tsc --noEmit
git add scripts/portfolio.ts CHANGELOG.md
git commit -m "feat(portfolio): upload command with per-shoot limit"
```

---

### Task 5: Skill `/portfolio`

**Files:**
- Create: `.claude/skills/portfolio-butler/SKILL.md`, `.claude/commands/portfolio.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: `.claude/skills/portfolio-butler/SKILL.md`**

````markdown
---
name: portfolio-butler
description: >-
  Správa fotek v portfoliu webu: porovná shooty na Google Drive s fotkami na webu,
  navrhne nejlepší fotky ze shootu, hlídá max 2 fotky na shoot a nahraje vybrané
  do Cloudinary. Použij, když uživatel chce přidat fotky na web, zkontrolovat
  portfolio, zjistit co na webu chybí, nebo zavolá /portfolio.
---

# Portfolio Butler

CLI: `npm run portfolio -- <příkaz>` (čte `.env.local`: `CLOUDINARY_*`, `PORTFOLIO_DRIVE_ROOT`).
Shoot = složka nejvyšší úrovně v `Guthovo fotky` včetně podsložek. Lokální název
složky je ID shootu (tvar `2026 9 - Kamča`; Drive for Desktop nahrazuje `/` z názvu na Drive mezerou). Na Drive jsou jen exporty 4–5★.

## Flow

1. `npm run portfolio -- status` → shrň: kolik fotek na webu z 50, shooty s 0 fotkami
   (nejnovější první), porušení limitu, fotky bez shootu. Fotky bez shootu jsou staré
   (před butlerem): až je shoot přenahraný, připomeň smazání starých v `/admin/fotky`
   a znovu označení ★ Selected Work.
2. Zeptej se, který shoot. Pokud uživatel neví, doporuč nejnovější s 0 fotkami.
3. `npm run portfolio -- previews "<shoot>" --out <scratchpad>/previews`, pak přečti
   náhledy (Read na `NNN.jpg`). U velkých shootů (>40) je projdi po dávkách.
4. Navrhni **top 3–5** ve formátu `NNN.jpg — proč` (kompozice, světlo, výraz,
   čím doplní stávající portfolio). Ukaž je uživateli.
5. Uživatel vybere (max tolik, kolik shootu zbývá do 2).
6. Pro každou vybranou navrhni kategorii (`portréty` | `svatby` | `larpy`) a alt text
   cs + en (popisný, 1 věta, bez „fotka…“). Po potvrzení:
   `npm run portfolio -- upload "<originál z map.json>" --category … --alt-cs "…" --alt-en "…"`
7. Na konci znovu `status` a připomeň, že web se obnoví do 5 minut.

## Pravidla

- Nikdy nenahrávej bez výslovného výběru uživatele.
- `--force` jen na výslovný pokyn uživatele.
- Firemní portréty: před uploadem se zeptej, jestli klient dal souhlas s portfoliem
  (smlouva to vyžaduje, `docs/smlouva-business-portrety.md`).
- Pokud web přesáhne 50 fotek, upozorni: nejstarší přestanou být vidět.
````

- [ ] **Step 2: `.claude/commands/portfolio.md`**

```markdown
---
description: Portfolio butler — co chybí na webu, návrh nejlepších fotek ze shootu, upload s limitem 2 na shoot.
argument-hint: [název shootu]
---

Invoke the **portfolio-butler** skill and follow `.claude/skills/portfolio-butler/SKILL.md`.

Volitelný shoot: $ARGUMENTS
```

- [ ] **Step 3: Ověření end-to-end**

V nové session Claude Code spusť `/portfolio`. Expected: proběhne `status`, dotaz na shoot, náhledy a návrh 3–5 fotek. Upload jen na pokyn uživatele.

- [ ] **Step 4: CHANGELOG + commit**

Odrážka: `- Skill \`/portfolio\` (\`.claude/skills/portfolio-butler\`): konverzační flow status → návrh → upload.`

```bash
git add .claude/skills/portfolio-butler/SKILL.md .claude/commands/portfolio.md CHANGELOG.md
git commit -m "feat(portfolio): /portfolio skill"
```
