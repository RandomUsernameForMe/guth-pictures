# Instagram Stories Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Týdenní poloautomatická tvorba a publikace Instagram stories: cron složí návrhy z Cloudinary fotek + textů, uživatel je v `/admin/stories` upraví a schválí (video se renderuje v prohlížeči, nahraje do Cloudinary), druhý cron publikuje přes Instagram Graph API.

**Architecture:** Nový modul `modules/stories` v guth-pictures (Next.js/Vercel). Šablony C/D zkopírované ze sousedního projektu `guth-story-generator` (render videa: html2canvas + WebCodecs VideoEncoder + mp4-muxer → H.264 MP4 přímo v prohlížeči). Stav v Vercel KV (JSON pole pod klíči `stories:*`). Dva Vercel crony. AI texty přes `@anthropic-ai/sdk` (`claude-opus-4-8`, structured outputs).

**Tech Stack:** Next.js 16, TypeScript, Vercel KV, Cloudinary (signed direct upload), vitest, html2canvas, mp4-muxer, @anthropic-ai/sdk, Instagram Graph API (FB stránka).

**Spec:** `docs/superpowers/specs/2026-07-17-instagram-stories-automation-design.md`

**Repo:** vše v `/Users/tomasjarkovsky/Documents/Claude Projects/guth-pictures`. Zdroj kopírovaných souborů: `/Users/tomasjarkovsky/Documents/Claude Projects/guth-story-generator`.

---

## Konvence projektu (pro workera bez kontextu)

- API routes: `app/api/.../route.ts`, autentizace `if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })` z `@/lib/auth` (viz `app/api/admin/toggle-selected/route.ts` jako vzor).
- KV: `getKv()` z `@/lib/kv` — vrací `null` bez env varů.
- Cloudinary server SDK: `cloudinary` z `@/lib/cloudinary`; klientské URL: `cloudinaryUrl()` z `@/lib/cloudinary-utils`.
- Testy: `vitest run`, soubory `__tests__/*.test.ts`; alias `server-only` je stubnutý (viz `vitest.config.ts`).
- Admin UI: Tailwind (zinc-950 dark), server page = `<AdminShell><Component/></AdminShell>`.
- Commity: konvenční prefixy (`feat:`, `test:`, `docs:`), commituj po každém tasku.

## Env vars (přidat do Vercelu + `.env.local`; uživatel dodá hodnoty)

| Var | Účel |
|---|---|
| `IG_USER_ID` | Instagram Business account ID (z Graph API) |
| `IG_ACCESS_TOKEN` | dlouhodobý user access token (seed; obnovy jdou do KV) |
| `FB_APP_ID`, `FB_APP_SECRET` | pro refresh tokenu (`fb_exchange_token`) |
| `CRON_SECRET` | Vercel cron auth (Vercel ho posílá jako `Authorization: Bearer …`) |
| `ANTHROPIC_API_KEY` | AI návrhy textů |

**Poznámka Vercel plán:** cron `*/15 min` vyžaduje Vercel Pro. Na Hobby plánu (1× denně) použij externí trigger (cron-job.org → GET na publish endpoint s `Authorization: Bearer $CRON_SECRET`). Endpoint je na tom nezávislý.

---

### Task 1: Závislosti + kopie šablon ze story-generatoru

**Files:**
- Modify: `package.json` (deps)
- Create: `modules/stories/components/story/{types.ts,useTick.ts,useExport.ts,primitives.tsx,PhotoCycle.tsx,TemplateC.tsx,TemplateD.tsx}`

- [ ] **Step 1: Nainstaluj závislosti**

```bash
cd "/Users/tomasjarkovsky/Documents/Claude Projects/guth-pictures"
npm install html2canvas mp4-muxer @anthropic-ai/sdk
```

- [ ] **Step 2: Zkopíruj soubory šablon**

```bash
SRC="/Users/tomasjarkovsky/Documents/Claude Projects/guth-story-generator/src"
DST="modules/stories/components/story"
mkdir -p "$DST"
cp "$SRC/types.ts" "$SRC/hooks/useTick.ts" "$SRC/hooks/useExport.ts" "$DST/"
cp "$SRC/components/primitives.tsx" "$SRC/components/PhotoCycle.tsx" "$SRC/components/TemplateC.tsx" "$SRC/components/TemplateD.tsx" "$DST/"
```

- [ ] **Step 3: Uprav importy a přidej "use client"**

V každém z `PhotoCycle.tsx`, `TemplateC.tsx`, `TemplateD.tsx`, `useTick.ts`, `useExport.ts`:
1. Přidej `"use client";` jako první řádek.
2. Oprav relativní importy: `'../hooks/useTick'` → `'./useTick'`, `'../types'` → `'./types'` (importy `'./primitives'`, `'./PhotoCycle'` zůstávají).

- [ ] **Step 4: Přejmenuj CSS proměnné fontů (kolize s portfoliem)**

Ve zkopírovaných `.tsx` souborech nahraď všude:
- `var(--font-sans)` → `var(--story-font-sans)`
- `var(--font-mono)` → `var(--story-font-mono)`

```bash
sed -i '' 's/var(--font-sans)/var(--story-font-sans)/g; s/var(--font-mono)/var(--story-font-mono)/g' modules/stories/components/story/*.tsx
```

- [ ] **Step 5: Ověř typy**

Run: `npx tsc --noEmit`
Expected: bez nových chyb v `modules/stories/**` (chyby existující jinde ignoruj, ale žádné by být neměly).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json modules/stories
git commit -m "feat(stories): copy story templates from guth-story-generator, add deps"
```

---

### Task 2: Spike — IG API setup guide + test publish script

Ověří rizikový řetězec (MP4 z generatoru → Cloudinary → IG akceptace) nezávisle na zbytku. **Vyžaduje akci uživatele** (Meta app, token) — worker vytvoří podklady, uživatel spike spustí, jakmile má token. Zbytek plánu na výsledku neblokuje (API tvary jsou dokumentované), ale spike musí proběhnout před prvním ostrým publishem.

**Files:**
- Create: `scripts/ig-test-publish.ts`
- Create: `docs/stories-ig-setup.md`

- [ ] **Step 1: Napiš setup guide**

`docs/stories-ig-setup.md`:

```markdown
# Instagram API — jednorázové nastavení

1. **Propoj IG s FB stránkou:** Instagram appka → Nastavení → Business tools → propojit s FB stránkou (musíš být admin stránky).
2. **Meta app:** https://developers.facebook.com → My Apps → Create App → typ "Business". App zůstává v Development módu (pro vlastní účet stačí).
3. **Oprávnění:** V Graph API Exploreru (https://developers.facebook.com/tools/explorer) vyber svou app a vygeneruj User Token s oprávněními:
   `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
4. **Dlouhodobý token:**
   `curl "https://graph.facebook.com/v23.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$FB_APP_ID&client_secret=$FB_APP_SECRET&fb_exchange_token=$KRATKY_TOKEN"`
   → `access_token` (platnost 60 dní) → env `IG_ACCESS_TOKEN`.
5. **IG User ID:**
   `curl "https://graph.facebook.com/v23.0/me/accounts?access_token=$TOKEN"` → vezmi `id` stránky, pak
   `curl "https://graph.facebook.com/v23.0/<PAGE_ID>?fields=instagram_business_account&access_token=$TOKEN"`
   → `instagram_business_account.id` → env `IG_USER_ID`.
6. **Test:** vyexportuj MP4 ze story-generatoru, nahraj ručně do Cloudinary (Media Library, folder `stories`), zkopíruj delivery URL (`https://res.cloudinary.com/<cloud>/video/upload/<id>.mp4`) a spusť:
   `IG_USER_ID=... IG_ACCESS_TOKEN=... VIDEO_URL=... npx tsx scripts/ig-test-publish.ts`
7. Ověř v IG appce, že story je publikovaná. Pokud Graph API vrátí chybu na video specs, zkus URL s transformací `.../video/upload/f_mp4,vc_h264/<id>.mp4` a zapiš výsledek sem.
```

- [ ] **Step 2: Napiš test script**

`scripts/ig-test-publish.ts` (samostatný, bez závislostí na modulu):

```typescript
const GRAPH = "https://graph.facebook.com/v23.0";
const { IG_USER_ID, IG_ACCESS_TOKEN, VIDEO_URL } = process.env;

if (!IG_USER_ID || !IG_ACCESS_TOKEN || !VIDEO_URL) {
  console.error("Usage: IG_USER_ID=... IG_ACCESS_TOKEN=... VIDEO_URL=... npx tsx scripts/ig-test-publish.ts");
  process.exit(1);
}

async function graphPost(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    body: new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN! }),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(JSON.stringify(json.error ?? json));
  return json;
}

async function main() {
  console.log("1/3 creating media container…");
  const { id: creationId } = await graphPost(`${IG_USER_ID}/media`, {
    media_type: "STORIES",
    video_url: VIDEO_URL!,
  });
  console.log("   container:", creationId);

  console.log("2/3 waiting for processing…");
  for (let i = 0; i < 24; i++) {
    const res = await fetch(`${GRAPH}/${creationId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`);
    const { status_code } = await res.json();
    console.log("   status:", status_code);
    if (status_code === "FINISHED") break;
    if (status_code === "ERROR") throw new Error("Container processing failed");
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log("3/3 publishing…");
  const { id } = await graphPost(`${IG_USER_ID}/media_publish`, { creation_id: creationId });
  console.log("PUBLISHED, media id:", id);
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
```

- [ ] **Step 3: Ověř, že script parsuje**

Run: `npx tsx scripts/ig-test-publish.ts`
Expected: vypíše `Usage: …` a exit code 1 (bez env varů).

- [ ] **Step 4: Commit**

```bash
git add scripts/ig-test-publish.ts docs/stories-ig-setup.md
git commit -m "feat(stories): IG setup guide + standalone test publish script"
```

---

### Task 3: Typy + KV store

**Files:**
- Create: `modules/stories/lib/types.ts`
- Create: `modules/stories/lib/store.ts`
- Test: `modules/stories/lib/__tests__/store.test.ts`

- [ ] **Step 1: Napiš typy**

`modules/stories/lib/types.ts`:

```typescript
export type StoryTemplate = "C" | "D";

export type StoryTextEntry = {
  id: string;
  template: StoryTemplate;
  headline?: string;    // C
  sub?: string;         // C
  words?: string[];     // D
  subHeadline?: string; // D
  source: "manual" | "ai";
  approved: boolean;
};

export type DraftPhoto = { publicId: string; x: number; y: number };

export type StoryDraft = {
  id: string;
  template: StoryTemplate;
  photos: DraftPhoto[];
  headline: string;
  sub: string;
  words: string[];
  subHeadline: string;
  textSource: "manual" | "ai";
  createdAt: string; // ISO
};

export type QueueItem = {
  id: string;
  template: StoryTemplate;
  videoPublicId: string;
  publishAt: string; // ISO
  status: "queued" | "published" | "failed";
  error?: string;
};

export type UsedPhoto = { publicId: string; usedAt: string };
```

- [ ] **Step 2: Napiš failing test**

`modules/stories/lib/__tests__/store.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const kvData = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(async (key: string) => kvData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvData.set(key, value); }),
  },
}));

import { getDrafts, saveDrafts, markPhotosUsed, getUsedPhotoIds } from "../store";
import type { StoryDraft } from "../types";

const draft: StoryDraft = {
  id: "d1", template: "C", photos: [{ publicId: "portfolio/a", x: 50, y: 50 }],
  headline: "H", sub: "S", words: [], subHeadline: "", textSource: "manual",
  createdAt: "2026-07-17T06:00:00.000Z",
};

beforeEach(() => {
  kvData.clear();
  process.env.KV_REST_API_URL = "https://test";
  process.env.KV_REST_API_TOKEN = "test";
});

describe("store", () => {
  it("returns empty array when nothing saved", async () => {
    expect(await getDrafts()).toEqual([]);
  });

  it("round-trips drafts", async () => {
    await saveDrafts([draft]);
    expect(await getDrafts()).toEqual([draft]);
  });

  it("markPhotosUsed accumulates and getUsedPhotoIds filters by age", async () => {
    await markPhotosUsed(["portfolio/a"], new Date("2026-05-01T00:00:00Z"));
    await markPhotosUsed(["portfolio/b"], new Date("2026-07-15T00:00:00Z"));
    // 8 týdnů zpět od 2026-07-17 => cutoff ~2026-05-22; "a" je starší, "b" novější
    const used = await getUsedPhotoIds(new Date("2026-07-17T00:00:00Z"));
    expect(used.has("portfolio/b")).toBe(true);
    expect(used.has("portfolio/a")).toBe(false);
  });
});
```

- [ ] **Step 3: Ověř, že test selže**

Run: `npx vitest run modules/stories/lib/__tests__/store.test.ts`
Expected: FAIL — `Cannot find module '../store'`.

- [ ] **Step 4: Implementuj store**

`modules/stories/lib/store.ts`:

```typescript
import "server-only";
import { getKv } from "@/lib/kv";
import type { StoryDraft, StoryTextEntry, QueueItem, UsedPhoto } from "./types";

const KEYS = {
  texts: "stories:texts",
  drafts: "stories:drafts",
  queue: "stories:queue",
  used: "stories:usedPhotos",
} as const;

const USED_WEEKS = 8;

async function read<T>(key: string): Promise<T[]> {
  const kv = await getKv();
  if (!kv) return [];
  return (await kv.get<T[]>(key)) ?? [];
}

async function write<T>(key: string, value: T[]): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(key, value);
}

export const getTexts = () => read<StoryTextEntry>(KEYS.texts);
export const saveTexts = (v: StoryTextEntry[]) => write(KEYS.texts, v);
export const getDrafts = () => read<StoryDraft>(KEYS.drafts);
export const saveDrafts = (v: StoryDraft[]) => write(KEYS.drafts, v);
export const getQueue = () => read<QueueItem>(KEYS.queue);
export const saveQueue = (v: QueueItem[]) => write(KEYS.queue, v);

export async function markPhotosUsed(publicIds: string[], now = new Date()): Promise<void> {
  const used = await read<UsedPhoto>(KEYS.used);
  const usedAt = now.toISOString();
  const merged = [
    ...used.filter(u => !publicIds.includes(u.publicId)),
    ...publicIds.map(publicId => ({ publicId, usedAt })),
  ];
  await write(KEYS.used, merged);
}

/** publicIds fotek použitých v posledních 8 týdnech */
export async function getUsedPhotoIds(now = new Date()): Promise<Set<string>> {
  const cutoff = new Date(now.getTime() - USED_WEEKS * 7 * 24 * 3600 * 1000);
  const used = await read<UsedPhoto>(KEYS.used);
  return new Set(used.filter(u => new Date(u.usedAt) >= cutoff).map(u => u.publicId));
}
```

- [ ] **Step 5: Ověř, že testy projdou**

Run: `npx vitest run modules/stories/lib/__tests__/store.test.ts`
Expected: PASS (3 testy).

- [ ] **Step 6: Commit**

```bash
git add modules/stories/lib
git commit -m "feat(stories): types + KV store with used-photo tracking"
```

---

### Task 4: Skládání návrhů (compose)

Čistá deterministická funkce — žádná náhoda (testovatelnost), výběr = nejnovější nepoužité fotky, round-robin kategorií, střídání šablon C/D.

**Files:**
- Create: `modules/stories/lib/compose.ts`
- Test: `modules/stories/lib/__tests__/compose.test.ts`

- [ ] **Step 1: Napiš failing test**

`modules/stories/lib/__tests__/compose.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { composeDrafts } from "../compose";
import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryTextEntry } from "../types";

function photo(publicId: string, category: GalleryPhoto["category"]): GalleryPhoto {
  return { publicId, width: 1000, height: 1500, alt: { cs: "", en: "" }, category };
}

const photos: GalleryPhoto[] = [
  photo("p1", "portréty"), photo("p2", "portréty"), photo("p3", "portréty"),
  photo("p4", "svatby"), photo("p5", "svatby"), photo("p6", "svatby"),
  photo("p7", "portréty"), photo("p8", "svatby"), photo("p9", "portréty"),
  photo("p10", "svatby"), photo("p11", "portréty"), photo("p12", "svatby"),
];

const texts: StoryTextEntry[] = [
  { id: "t1", template: "C", headline: "Silná\natmosféra.", sub: "Osobité portréty.", source: "manual", approved: true },
  { id: "t2", template: "D", words: ["Portréty.", "Svatby."], subHeadline: "Guth Pictures", source: "manual", approved: true },
  { id: "t3", template: "C", headline: "NESCHVÁLENO", sub: "x", source: "ai", approved: false },
];

describe("composeDrafts", () => {
  it("creates requested count, alternating templates C/D", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 4 });
    expect(drafts).toHaveLength(4);
    expect(drafts.map(d => d.template)).toEqual(["C", "D", "C", "D"]);
  });

  it("uses only unused photos and does not repeat within batch", () => {
    const { drafts, usedNow } = composeDrafts({ photos, usedIds: new Set(["p1", "p2"]), texts, count: 2 });
    const ids = drafts.flatMap(d => d.photos.map(p => p.publicId));
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p2");
    expect(new Set(ids).size).toBe(ids.length);
    expect(usedNow).toEqual(ids);
  });

  it("only uses approved texts", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 4 });
    for (const d of drafts) expect(d.headline).not.toBe("NESCHVÁLENO");
  });

  it("shrinks batch when photos run out instead of failing", () => {
    const few = photos.slice(0, 5);
    const { drafts } = composeDrafts({ photos: few, usedIds: new Set(), texts, count: 4 });
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(drafts.length).toBeLessThan(4);
  });

  it("photos default to centered focal point", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 1 });
    expect(drafts[0].photos[0]).toMatchObject({ x: 50, y: 50 });
  });
});
```

- [ ] **Step 2: Ověř FAIL**

Run: `npx vitest run modules/stories/lib/__tests__/compose.test.ts`
Expected: FAIL — `Cannot find module '../compose'`.

- [ ] **Step 3: Implementuj**

`modules/stories/lib/compose.ts`:

```typescript
import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft, StoryTextEntry, StoryTemplate } from "./types";

const PHOTOS_PER_STORY = 4;

export type ComposedDraft = Omit<StoryDraft, "id" | "createdAt">;

/**
 * Deterministické složení návrhů: fotky se berou round-robin napříč kategoriemi
 * (v pořadí vstupu = nejnovější první z Cloudinary), šablony se střídají C/D,
 * texty rotují ze schváleného zásobníku. Když nestačí fotky, batch se zmenší.
 */
export function composeDrafts(opts: {
  photos: GalleryPhoto[];
  usedIds: Set<string>;
  texts: StoryTextEntry[];
  count: number;
}): { drafts: ComposedDraft[]; usedNow: string[] } {
  const available = opts.photos.filter(p => !opts.usedIds.has(p.publicId));

  // round-robin přes kategorie, ať jeden batch nemá jen svatby
  const byCategory = new Map<string, GalleryPhoto[]>();
  for (const p of available) {
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }
  const pool: GalleryPhoto[] = [];
  const buckets = [...byCategory.values()];
  for (let i = 0; pool.length < available.length; i++) {
    for (const bucket of buckets) if (bucket[i]) pool.push(bucket[i]);
  }

  const cTexts = opts.texts.filter(t => t.approved && t.template === "C");
  const dTexts = opts.texts.filter(t => t.approved && t.template === "D");

  const drafts: ComposedDraft[] = [];
  const usedNow: string[] = [];
  let cursor = 0;

  for (let i = 0; i < opts.count; i++) {
    if (cursor + PHOTOS_PER_STORY > pool.length) break;
    const template: StoryTemplate = i % 2 === 0 ? "C" : "D";
    const slice = pool.slice(cursor, cursor + PHOTOS_PER_STORY);
    cursor += PHOTOS_PER_STORY;
    usedNow.push(...slice.map(p => p.publicId));

    const c = cTexts.length ? cTexts[Math.floor(i / 2) % cTexts.length] : undefined;
    const d = dTexts.length ? dTexts[Math.floor(i / 2) % dTexts.length] : undefined;

    drafts.push({
      template,
      photos: slice.map(p => ({ publicId: p.publicId, x: 50, y: 50 })),
      headline: c?.headline ?? "",
      sub: c?.sub ?? "",
      words: d?.words ?? [],
      subHeadline: d?.subHeadline ?? "",
      textSource: (template === "C" ? c?.source : d?.source) ?? "manual",
    });
  }

  return { drafts, usedNow };
}
```

- [ ] **Step 4: Ověř PASS**

Run: `npx vitest run modules/stories/lib/__tests__/compose.test.ts`
Expected: PASS (5 testů).

- [ ] **Step 5: Commit**

```bash
git add modules/stories/lib
git commit -m "feat(stories): deterministic draft composition"
```

---

### Task 5: AI návrhy textů (Claude)

**Files:**
- Create: `modules/stories/lib/claude.ts`
- Test: `modules/stories/lib/__tests__/claude.test.ts`

- [ ] **Step 1: Napiš failing test**

`modules/stories/lib/__tests__/claude.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { suggestTexts } from "../claude";

describe("suggestTexts", () => {
  it("maps parsed output to unapproved ai text entries", async () => {
    const fakeClient = {
      messages: {
        parse: vi.fn(async () => ({
          parsed_output: {
            c: { headline: "Světlo\na stín.", sub: "Portréty s náladou." },
            d: { words: ["Portréty.", "Eventy.", "Svatby."], subHeadline: "Guth Pictures" },
          },
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await suggestTexts(["portréty", "svatby"], fakeClient as any);
    expect(result).toHaveLength(2);
    const c = result.find(t => t.template === "C")!;
    expect(c).toMatchObject({ headline: "Světlo\na stín.", source: "ai", approved: false });
    const d = result.find(t => t.template === "D")!;
    expect(d.words).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Ověř FAIL**

Run: `npx vitest run modules/stories/lib/__tests__/claude.test.ts`
Expected: FAIL — `Cannot find module '../claude'`.

- [ ] **Step 3: Implementuj**

`modules/stories/lib/claude.ts`:

```typescript
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { StoryTextEntry } from "./types";

const SCHEMA = {
  type: "object",
  properties: {
    c: {
      type: "object",
      properties: { headline: { type: "string" }, sub: { type: "string" } },
      required: ["headline", "sub"],
      additionalProperties: false,
    },
    d: {
      type: "object",
      properties: {
        words: { type: "array", items: { type: "string" } },
        subHeadline: { type: "string" },
      },
      required: ["words", "subHeadline"],
      additionalProperties: false,
    },
  },
  required: ["c", "d"],
  additionalProperties: false,
} as const;

type Parsed = {
  c: { headline: string; sub: string };
  d: { words: string[]; subHeadline: string };
};

const SYSTEM = `Píšeš krátké české texty na Instagram stories fotografa (Guth Pictures — portréty, svatby, eventy, larpy; Praha).
Tón: sebevědomý, úsporný, bez emoji, bez vykřičníků. Headline max 2 krátká slova na řádek (zlom řádku znakem \\n), sub max 8 slov. Words: 3-4 jednoslovné údery zakončené tečkou.`;

/** Vrátí 2 neschválené AI návrhy textů (1× šablona C, 1× D). */
export async function suggestTexts(
  categories: string[],
  client: Pick<Anthropic, "messages"> = new Anthropic(),
): Promise<StoryTextEntry[]> {
  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{
      role: "user",
      content: `Navrhni texty pro stories z fotek kategorií: ${categories.join(", ")}.`,
    }],
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
  });

  const parsed = response.parsed_output as Parsed | null;
  if (!parsed) throw new Error("Claude returned no parsed output");

  const stamp = Date.now();
  return [
    { id: `ai-c-${stamp}`, template: "C", headline: parsed.c.headline, sub: parsed.c.sub, source: "ai", approved: false },
    { id: `ai-d-${stamp}`, template: "D", words: parsed.d.words, subHeadline: parsed.d.subHeadline, source: "ai", approved: false },
  ];
}
```

Pozn.: pokud `client.messages.parse` v nainstalované verzi SDK neexistuje nebo má jinou signaturu, použij `client.messages.create` se stejným `output_config` a `JSON.parse` textového bloku — ověř podle typů SDK, neodhaduj.

- [ ] **Step 4: Ověř PASS**

Run: `npx vitest run modules/stories/lib/__tests__/claude.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add modules/stories/lib
git commit -m "feat(stories): AI text suggestions via Claude structured output"
```

---

### Task 6: Instagram publish modul

**Files:**
- Create: `modules/stories/lib/instagram.ts`
- Test: `modules/stories/lib/__tests__/instagram.test.ts`

- [ ] **Step 1: Napiš failing test**

`modules/stories/lib/__tests__/instagram.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const kvData = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(async (key: string) => kvData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvData.set(key, value); }),
  },
}));

import { publishStory, refreshTokenIfNeeded } from "../instagram";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

beforeEach(() => {
  kvData.clear();
  process.env.KV_REST_API_URL = "https://test";
  process.env.KV_REST_API_TOKEN = "test";
  process.env.IG_USER_ID = "17840000000000000";
  process.env.IG_ACCESS_TOKEN = "seed-token";
  process.env.FB_APP_ID = "app-id";
  process.env.FB_APP_SECRET = "app-secret";
});

describe("publishStory", () => {
  it("creates container, polls until FINISHED, publishes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "IN_PROGRESS" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "media-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const mediaId = await publishStory("https://res.cloudinary.com/x/video/upload/v.mp4", { pollIntervalMs: 0 });
    expect(mediaId).toBe("media-1");
    expect(fetchMock.mock.calls[0][0]).toContain("/17840000000000000/media");
    expect(String(fetchMock.mock.calls[3][0])).toContain("/media_publish");
  });

  it("throws with Graph error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      jsonResponse({ error: { message: "Invalid video" } }, false),
    ));
    await expect(publishStory("https://x/v.mp4", { pollIntervalMs: 0 })).rejects.toThrow("Invalid video");
  });
});

describe("refreshTokenIfNeeded", () => {
  it("stores refreshed token in KV when expiry is near", async () => {
    kvData.set("stories:igAuth", {
      accessToken: "old-token",
      expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), // za 5 dní
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      jsonResponse({ access_token: "new-token", expires_in: 5184000 }),
    ));
    await refreshTokenIfNeeded();
    const auth = kvData.get("stories:igAuth") as { accessToken: string };
    expect(auth.accessToken).toBe("new-token");
  });

  it("does nothing when token is fresh", async () => {
    kvData.set("stories:igAuth", {
      accessToken: "fresh",
      expiresAt: new Date(Date.now() + 50 * 24 * 3600 * 1000).toISOString(),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await refreshTokenIfNeeded();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Ověř FAIL**

Run: `npx vitest run modules/stories/lib/__tests__/instagram.test.ts`
Expected: FAIL — `Cannot find module '../instagram'`.

- [ ] **Step 3: Implementuj**

`modules/stories/lib/instagram.ts`:

```typescript
import "server-only";
import { getKv } from "@/lib/kv";

const GRAPH = "https://graph.facebook.com/v23.0";
const AUTH_KEY = "stories:igAuth";
const REFRESH_BEFORE_DAYS = 10;

type IgAuth = { accessToken: string; expiresAt: string };

async function getStoredAuth(): Promise<IgAuth | null> {
  const kv = await getKv();
  if (!kv) return null;
  return await kv.get<IgAuth>(AUTH_KEY);
}

async function getToken(): Promise<string> {
  const stored = await getStoredAuth();
  if (stored) return stored.accessToken;
  const env = process.env.IG_ACCESS_TOKEN;
  if (!env) throw new Error("IG_ACCESS_TOKEN not configured");
  return env;
}

async function graphJson(res: Response): Promise<Record<string, unknown>> {
  const json = await res.json();
  if (!res.ok || json.error) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? JSON.stringify(json);
    throw new Error(`Instagram API: ${msg}`);
  }
  return json;
}

/** Publikuje video jako IG story. Vrací media id. */
export async function publishStory(
  videoUrl: string,
  opts: { pollIntervalMs?: number; maxPolls?: number } = {},
): Promise<string> {
  const { pollIntervalMs = 5000, maxPolls = 24 } = opts;
  const userId = process.env.IG_USER_ID;
  if (!userId) throw new Error("IG_USER_ID not configured");
  const token = await getToken();

  const created = await graphJson(await fetch(`${GRAPH}/${userId}/media`, {
    method: "POST",
    body: new URLSearchParams({ media_type: "STORIES", video_url: videoUrl, access_token: token }),
  }));
  const creationId = created.id as string;

  let finished = false;
  for (let i = 0; i < maxPolls; i++) {
    const status = await graphJson(await fetch(
      `${GRAPH}/${creationId}?fields=status_code&access_token=${token}`,
    ));
    if (status.status_code === "FINISHED") { finished = true; break; }
    if (status.status_code === "ERROR") throw new Error("Instagram API: container processing failed");
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  if (!finished) throw new Error("Instagram API: container processing timed out");

  const published = await graphJson(await fetch(`${GRAPH}/${userId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: creationId, access_token: token }),
  }));
  return published.id as string;
}

/** Obnoví dlouhodobý token, když zbývá <10 dní. Nový token jde do KV. */
export async function refreshTokenIfNeeded(now = new Date()): Promise<void> {
  const stored = await getStoredAuth();
  const expiresAt = stored ? new Date(stored.expiresAt) : new Date(0); // env seed: expiraci neznáme → refreshni hned
  const daysLeft = (expiresAt.getTime() - now.getTime()) / (24 * 3600 * 1000);
  if (daysLeft > REFRESH_BEFORE_DAYS) return;

  const { FB_APP_ID, FB_APP_SECRET } = process.env;
  if (!FB_APP_ID || !FB_APP_SECRET) throw new Error("FB_APP_ID/FB_APP_SECRET not configured");
  const current = await getToken();

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: current,
  });
  const json = await graphJson(await fetch(`${GRAPH}/oauth/access_token?${params}`));

  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const expiresIn = (json.expires_in as number | undefined) ?? 60 * 24 * 3600;
  await kv.set(AUTH_KEY, {
    accessToken: json.access_token as string,
    expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
  } satisfies IgAuth);
}
```

- [ ] **Step 4: Ověř PASS**

Run: `npx vitest run modules/stories/lib/__tests__/instagram.test.ts`
Expected: PASS (4 testy).

- [ ] **Step 5: Commit**

```bash
git add modules/stories/lib
git commit -m "feat(stories): Instagram Graph API publish + token refresh"
```

---

### Task 7: Admin API routes

CRUD nad KV + podpis pro video upload. Všechny chráněné `isAuthenticated()`. Vzor: `app/api/admin/toggle-selected/route.ts` a `app/api/admin/upload-signature/route.ts`.

**Files:**
- Create: `app/api/admin/stories/drafts/route.ts`
- Create: `app/api/admin/stories/texts/route.ts`
- Create: `app/api/admin/stories/queue/route.ts`
- Create: `app/api/admin/stories/approve/route.ts`
- Create: `app/api/admin/stories/upload-signature/route.ts`
- Test: `app/api/admin/stories/approve/__tests__/validation.test.ts`

- [ ] **Step 1: drafts route**

`app/api/admin/stories/drafts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDrafts, saveDrafts } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ drafts: await getDrafts() });
}

// vytvoření ručního návrhu
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const draft: StoryDraft = {
    id: `d-${Date.now()}`,
    template: body.template === "D" ? "D" : "C",
    photos: [], headline: "", sub: "", words: [], subHeadline: "",
    textSource: "manual",
    createdAt: new Date().toISOString(),
  };
  const drafts = await getDrafts();
  await saveDrafts([draft, ...drafts]);
  return NextResponse.json({ draft });
}

// úprava návrhu (full replace podle id)
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { draft } = (await req.json()) as { draft?: StoryDraft };
  if (!draft?.id) return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  const drafts = await getDrafts();
  if (!drafts.some(d => d.id === draft.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveDrafts(drafts.map(d => (d.id === draft.id ? draft : d)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const drafts = await getDrafts();
  await saveDrafts(drafts.filter(d => d.id !== id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: texts route**

`app/api/admin/stories/texts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getTexts, saveTexts } from "@/modules/stories/lib/store";
import type { StoryTextEntry } from "@/modules/stories/lib/types";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ texts: await getTexts() });
}

// přidání nového textu (schválený manual)
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<StoryTextEntry>;
  if (body.template !== "C" && body.template !== "D") {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }
  const entry: StoryTextEntry = {
    id: `t-${Date.now()}`,
    template: body.template,
    headline: body.headline, sub: body.sub,
    words: body.words, subHeadline: body.subHeadline,
    source: "manual", approved: true,
  };
  await saveTexts([entry, ...(await getTexts())]);
  return NextResponse.json({ text: entry });
}

// úprava/schválení (full replace podle id)
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { text } = (await req.json()) as { text?: StoryTextEntry };
  if (!text?.id) return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  const texts = await getTexts();
  await saveTexts(texts.map(t => (t.id === text.id ? text : t)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await saveTexts((await getTexts()).filter(t => t.id !== id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: queue route**

`app/api/admin/stories/queue/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ queue: await getQueue() });
}

// re-queue failed položky (případně s novým časem)
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, publishAt } = (await req.json()) as { id?: string; publishAt?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const queue = await getQueue();
  await saveQueue(queue.map(item =>
    item.id === id
      ? { ...item, status: "queued", error: undefined, publishAt: publishAt ?? item.publishAt }
      : item,
  ));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await saveQueue((await getQueue()).filter(item => item.id !== id));
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Napiš failing validation test pro approve**

`app/api/admin/stories/approve/__tests__/validation.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { validateApproveBody } from "../validation";

describe("validateApproveBody", () => {
  const valid = {
    draftId: "d-1",
    videoPublicId: "stories/guth-story-123",
    publishAt: "2026-07-20T18:00:00.000Z",
  };

  it("accepts valid body", () => {
    expect(validateApproveBody(valid)).toBeNull();
  });

  it.each([
    ["missing draftId", { ...valid, draftId: undefined }],
    ["invalid publicId chars", { ...valid, videoPublicId: "../../etc" }],
    ["invalid date", { ...valid, publishAt: "not-a-date" }],
  ])("rejects %s", (_label, body) => {
    expect(validateApproveBody(body as Record<string, unknown>)).toBeTruthy();
  });
});
```

- [ ] **Step 5: Ověř FAIL, pak implementuj approve**

Run: `npx vitest run app/api/admin/stories/approve` → FAIL (missing module).

`app/api/admin/stories/approve/validation.ts`:

```typescript
const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;

export type ApproveBody = { draftId: string; videoPublicId: string; publishAt: string };

/** Vrací chybovou hlášku, nebo null když je body validní. */
export function validateApproveBody(body: Record<string, unknown>): string | null {
  if (typeof body.draftId !== "string" || !body.draftId) return "Invalid draftId";
  if (
    typeof body.videoPublicId !== "string" ||
    !CLOUDINARY_ID_RE.test(body.videoPublicId) ||
    body.videoPublicId.includes("..")
  ) return "Invalid videoPublicId";
  if (typeof body.publishAt !== "string" || Number.isNaN(Date.parse(body.publishAt))) return "Invalid publishAt";
  return null;
}
```

`app/api/admin/stories/approve/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDrafts, saveDrafts, getQueue, saveQueue } from "@/modules/stories/lib/store";
import { validateApproveBody, type ApproveBody } from "./validation";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const error = validateApproveBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { draftId, videoPublicId, publishAt } = body as ApproveBody;

  const drafts = await getDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  await saveQueue([
    ...(await getQueue()),
    { id: `q-${Date.now()}`, template: draft.template, videoPublicId, publishAt, status: "queued" },
  ]);
  await saveDrafts(drafts.filter(d => d.id !== draftId));
  return NextResponse.json({ ok: true });
}
```

Run: `npx vitest run app/api/admin/stories/approve` → PASS.

- [ ] **Step 6: upload-signature pro video**

`app/api/admin/stories/upload-signature/route.ts` (vzor existující route, jen folder `stories` a bez contextu):

```typescript
import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import { isAuthenticated } from "@/lib/auth";

export async function POST() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "stories";
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, secret);

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    folder,
  });
}
```

- [ ] **Step 7: Ověř typy + testy, commit**

Run: `npx tsc --noEmit && npx vitest run modules/stories app/api/admin/stories`
Expected: PASS.

```bash
git add app/api/admin/stories
git commit -m "feat(stories): admin API routes (drafts, texts, queue, approve, upload signature)"
```

---

### Task 8: Cron 1 — generování návrhů + vercel.json

**Files:**
- Create: `app/api/cron/stories-drafts/route.ts`
- Create: `vercel.json`

- [ ] **Step 1: Cron route**

`app/api/cron/stories-drafts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { composeDrafts } from "@/modules/stories/lib/compose";
import { suggestTexts } from "@/modules/stories/lib/claude";
import { getTexts, saveTexts, getDrafts, saveDrafts, getUsedPhotoIds, markPhotosUsed } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";

const DRAFT_COUNT = 4;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await getGalleryPhotos("portfolio");
  // preferuj kurátorský výběr (tag selected_work), fallback na vše
  const selected = photos.filter(p => p.selected);
  const pool = selected.length >= DRAFT_COUNT * 4 ? selected : photos;

  // AI návrhy textů — best effort, výpadek Claude nesmí shodit cron
  let texts = await getTexts();
  try {
    const categories = [...new Set(pool.map(p => p.category))];
    const aiTexts = await suggestTexts(categories);
    texts = [...aiTexts, ...texts];
    await saveTexts(texts);
  } catch (err) {
    console.error("[stories-drafts] AI texts failed:", err);
  }

  const usedIds = await getUsedPhotoIds();
  const { drafts: composed, usedNow } = composeDrafts({ photos: pool, usedIds, texts, count: DRAFT_COUNT });

  const stamp = Date.now();
  const drafts: StoryDraft[] = composed.map((d, i) => ({
    ...d, id: `d-${stamp}-${i}`, createdAt: new Date().toISOString(),
  }));

  await saveDrafts([...drafts, ...(await getDrafts())]);
  await markPhotosUsed(usedNow);

  return NextResponse.json({ ok: true, created: drafts.length });
}
```

- [ ] **Step 2: vercel.json**

`vercel.json` (soubor zatím neexistuje):

```json
{
  "crons": [
    { "path": "/api/cron/stories-drafts", "schedule": "0 6 * * 1" },
    { "path": "/api/cron/stories-publish", "schedule": "*/15 * * * *" }
  ]
}
```

Pozn.: `stories-publish` route vznikne v Tasku 9; Vercel deploy s neexistující cestou by selhal, proto Task 9 musí být nasazen společně (v jedné větvi to nevadí).

- [ ] **Step 3: Ověř typy, commit**

Run: `npx tsc --noEmit`
Expected: bez chyb.

```bash
git add app/api/cron/stories-drafts vercel.json
git commit -m "feat(stories): weekly draft generation cron"
```

---

### Task 9: Cron 2 — publikace fronty

**Files:**
- Create: `app/api/cron/stories-publish/route.ts`

- [ ] **Step 1: Route**

`app/api/cron/stories-publish/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";
import { publishStory, refreshTokenIfNeeded } from "@/modules/stories/lib/instagram";
import type { QueueItem } from "@/modules/stories/lib/types";

export const maxDuration = 300; // container poll může trvat minuty

function videoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.mp4`;
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const queue = await getQueue();
  const results: QueueItem[] = [];

  for (const item of queue) {
    if (item.status !== "queued" || new Date(item.publishAt) > now) {
      results.push(item);
      continue;
    }
    try {
      await publishStory(videoUrl(item.videoPublicId));
      results.push({ ...item, status: "published", error: undefined });
    } catch (err) {
      console.error(`[stories-publish] ${item.id} failed:`, err);
      results.push({ ...item, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }
  await saveQueue(results);

  // údržba tokenu — best effort
  try {
    await refreshTokenIfNeeded();
  } catch (err) {
    console.error("[stories-publish] token refresh failed:", err);
  }

  const published = results.filter((r, i) => r.status === "published" && queue[i]?.status === "queued").length;
  return NextResponse.json({ ok: true, published });
}
```

- [ ] **Step 2: Ověř typy + celé testy, commit**

Run: `npx tsc --noEmit && npm test`
Expected: PASS, žádné regrese.

```bash
git add app/api/cron/stories-publish
git commit -m "feat(stories): publish cron with IG token maintenance"
```

---

### Task 10: Admin UI — /admin/stories

Tři záložky: **Návrhy** (preview + úpravy + schválení s renderem), **Fronta**, **Texty**. Render videa = mechanismus z generatoru (skrytý full-res kontejner + `useExport` + `exportTick`).

**Files:**
- Create: `app/admin/stories/page.tsx`
- Create: `modules/stories/components/StoriesAdmin.tsx`
- Create: `modules/stories/components/DraftCard.tsx`
- Modify: `modules/admin/components/AdminNav.tsx` (přidat tab)

- [ ] **Step 1: Přidej nav tab**

V `modules/admin/components/AdminNav.tsx` přidej do pole `tabs` (za `navrhy`):

```typescript
  { href: "/admin/stories", label: "Stories" },
```

- [ ] **Step 2: Server page**

`app/admin/stories/page.tsx`:

```typescript
import { DM_Sans, DM_Mono } from "next/font/google";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { AdminShell } from "@/modules/admin/components/AdminShell";
import { StoriesAdmin } from "@/modules/stories/components/StoriesAdmin";

const dmSans = DM_Sans({ subsets: ["latin"] });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"] });

export default async function StoriesPage() {
  const photos = await getGalleryPhotos("portfolio");
  return (
    <AdminShell>
      <div style={{
        "--story-font-sans": dmSans.style.fontFamily,
        "--story-font-mono": dmMono.style.fontFamily,
      } as React.CSSProperties}>
        <StoriesAdmin galleryPhotos={photos} />
      </div>
    </AdminShell>
  );
}
```

- [ ] **Step 3: StoriesAdmin**

`modules/stories/components/StoriesAdmin.tsx`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft, StoryTextEntry, QueueItem } from "../lib/types";
import { DraftCard } from "./DraftCard";

type Tab = "drafts" | "queue" | "texts";

export function StoriesAdmin({ galleryPhotos }: { galleryPhotos: GalleryPhoto[] }) {
  const [tab, setTab] = useState<Tab>("drafts");
  const [drafts, setDrafts] = useState<StoryDraft[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [texts, setTexts] = useState<StoryTextEntry[]>([]);
  const [newText, setNewText] = useState({ template: "C", headline: "", sub: "", words: "", subHeadline: "" });

  const reload = useCallback(async () => {
    const [d, q, t] = await Promise.all([
      fetch("/api/admin/stories/drafts").then(r => r.json()),
      fetch("/api/admin/stories/queue").then(r => r.json()),
      fetch("/api/admin/stories/texts").then(r => r.json()),
    ]);
    setDrafts(d.drafts ?? []);
    setQueue(q.queue ?? []);
    setTexts(t.texts ?? []);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function addManualDraft() {
    await fetch("/api/admin/stories/drafts", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: "C" }),
    });
    await reload();
  }

  async function addText() {
    const body = newText.template === "C"
      ? { template: "C", headline: newText.headline, sub: newText.sub }
      : { template: "D", words: newText.words.split(",").map(w => w.trim()).filter(Boolean), subHeadline: newText.subHeadline };
    await fetch("/api/admin/stories/texts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setNewText({ template: "C", headline: "", sub: "", words: "", subHeadline: "" });
    await reload();
  }

  async function updateText(text: StoryTextEntry) {
    await fetch("/api/admin/stories/texts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    });
    await reload();
  }

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)}
      className={`px-4 py-2 text-sm font-medium ${tab === t ? "bg-white text-black" : "text-gray-400 border border-white/10 hover:text-white"}`}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-1 mb-8">
        {tabBtn("drafts", `Návrhy (${drafts.length})`)}
        {tabBtn("queue", `Fronta (${queue.filter(q => q.status === "queued").length})`)}
        {tabBtn("texts", "Texty")}
      </div>

      {tab === "drafts" && (
        <div className="space-y-6">
          <button onClick={addManualDraft} className="text-sm border border-white/20 px-3 py-1.5 hover:border-white/50">
            + Nový návrh
          </button>
          {drafts.map(d => (
            <DraftCard key={d.id} draft={d} galleryPhotos={galleryPhotos} onChanged={reload} />
          ))}
          {drafts.length === 0 && <p className="text-gray-500 text-sm">Žádné návrhy. Cron je generuje v pondělí ráno.</p>}
        </div>
      )}

      {tab === "queue" && (
        <table className="w-full text-sm">
          <thead><tr className="text-left text-gray-500">
            <th className="py-2">Video</th><th>Publikace</th><th>Stav</th><th></th>
          </tr></thead>
          <tbody>
            {queue.map(item => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="py-2 font-mono text-xs">{item.videoPublicId}</td>
                <td>{new Date(item.publishAt).toLocaleString("cs-CZ")}</td>
                <td>
                  {item.status === "queued" && <span className="text-amber-400">ve frontě</span>}
                  {item.status === "published" && <span className="text-green-400">publikováno</span>}
                  {item.status === "failed" && <span className="text-red-400" title={item.error}>chyba: {item.error}</span>}
                </td>
                <td className="text-right space-x-2">
                  {item.status === "failed" && (
                    <button className="text-xs border border-white/20 px-2 py-1"
                      onClick={async () => {
                        await fetch("/api/admin/stories/queue", {
                          method: "PUT", headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: item.id }),
                        });
                        await reload();
                      }}>
                      Znovu
                    </button>
                  )}
                  <button className="text-xs text-gray-500 hover:text-red-400"
                    onClick={async () => {
                      await fetch(`/api/admin/stories/queue?id=${item.id}`, { method: "DELETE" });
                      await reload();
                    }}>
                    Smazat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "texts" && (
        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2 border border-white/10 p-4">
            <select value={newText.template} onChange={e => setNewText({ ...newText, template: e.target.value })}
              className="bg-zinc-900 border border-white/20 px-2 py-1 text-sm">
              <option value="C">Šablona C (headline)</option>
              <option value="D">Šablona D (slova)</option>
            </select>
            {newText.template === "C" ? (
              <>
                <input placeholder="Headline (\n = nový řádek)" value={newText.headline}
                  onChange={e => setNewText({ ...newText, headline: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
                <input placeholder="Podtitulek" value={newText.sub}
                  onChange={e => setNewText({ ...newText, sub: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
              </>
            ) : (
              <>
                <input placeholder="Slova oddělená čárkou (Portréty., Svatby., …)" value={newText.words}
                  onChange={e => setNewText({ ...newText, words: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
                <input placeholder="Podtitulek" value={newText.subHeadline}
                  onChange={e => setNewText({ ...newText, subHeadline: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/20 px-2 py-1 text-sm" />
              </>
            )}
            <button onClick={addText} className="text-sm border border-white/20 px-3 py-1.5 hover:border-white/50">Přidat</button>
          </div>

          {texts.map(t => (
            <div key={t.id} className="flex items-center justify-between border-t border-white/10 py-2 text-sm">
              <div>
                <span className="text-gray-500 font-mono text-xs mr-2">[{t.template}{t.source === "ai" ? " · AI" : ""}]</span>
                {t.template === "C" ? `${t.headline?.replace("\n", " / ")} — ${t.sub}` : `${t.words?.join(" ")} — ${t.subHeadline}`}
              </div>
              <div className="space-x-2">
                {!t.approved && (
                  <button className="text-xs text-green-400" onClick={() => updateText({ ...t, approved: true })}>Schválit</button>
                )}
                <button className="text-xs text-gray-500 hover:text-red-400"
                  onClick={async () => {
                    await fetch(`/api/admin/stories/texts?id=${t.id}`, { method: "DELETE" });
                    await reload();
                  }}>
                  Smazat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: DraftCard (preview, úpravy, render + schválení)**

`modules/stories/components/DraftCard.tsx`:

```typescript
"use client";

import { useRef, useState, useCallback } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft } from "../lib/types";
import { TemplateC } from "./story/TemplateC";
import { TemplateD } from "./story/TemplateD";
import { useExport, FPS } from "./story/useExport";
import type { Photo } from "./story/types";

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 420 / H;
const SLIDE_MS = 2400;

export function DraftCard({ draft, galleryPhotos, onChanged }: {
  draft: StoryDraft;
  galleryPhotos: GalleryPhoto[];
  onChanged: () => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [publishAt, setPublishAt] = useState("");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportTick, setExportTick] = useState<number | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { exportVideo } = useExport();

  const photos: Photo[] = d.photos.map(p => ({
    url: cloudinaryUrl(p.publicId, "w_1080,h_1920,c_fill,q_auto,f_jpg"),
    x: p.x, y: p.y,
  }));

  const slideCount = d.template === "C"
    ? Math.max(d.photos.length, 1)
    : Math.max(d.words.filter(Boolean).length, 1);

  const templateProps = { photos, duration: SLIDE_MS, paused, lang: "cs" as const, chrome: false };

  function patch(p: Partial<StoryDraft>) { setD(prev => ({ ...prev, ...p })); }

  async function save() {
    await fetch("/api/admin/stories/drafts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }),
    });
    await onChanged();
  }

  async function remove() {
    await fetch(`/api/admin/stories/drafts?id=${d.id}`, { method: "DELETE" });
    await onChanged();
  }

  const onFrameStart = useCallback(async (frameIndex: number) => {
    const framesPerSlide = Math.round(SLIDE_MS / 1000 * FPS);
    setExportTick(Math.floor(frameIndex / framesPerSlide) % slideCount);
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, [slideCount]);

  async function approve() {
    if (!publishAt || d.photos.length === 0 || exporting) return;
    setExporting(true);
    try {
      // 1. render videa v prohlížeči
      const recordDuration = SLIDE_MS * slideCount + 800;
      const blob = await exportVideo(exportRef.current!, recordDuration, setProgress, onFrameStart);

      // 2. signed direct upload do Cloudinary (video)
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const form = new FormData();
      form.append("file", blob, `story-${d.id}.mp4`);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const uploaded = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
        { method: "POST", body: form },
      ).then(r => r.json());
      if (!uploaded.public_id) throw new Error(uploaded.error?.message ?? "Upload failed");

      // 3. přesun do fronty
      const res = await fetch("/api/admin/stories/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: d.id,
          videoPublicId: uploaded.public_id,
          publishAt: new Date(publishAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await onChanged();
    } catch (err) {
      alert(`Schválení selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  return (
    <div className="flex gap-6 border border-white/10 p-4">
      {/* preview */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-lg cursor-pointer"
          style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
          onClick={() => setPaused(p => !p)} title="Kliknutím pauza/play">
          {d.template === "C"
            ? <TemplateC {...templateProps} headline={d.headline} sub={d.sub} scale={PREVIEW_SCALE} />
            : <TemplateD {...templateProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={PREVIEW_SCALE} />}
        </div>
      </div>

      {/* editace */}
      <div className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <select value={d.template} onChange={e => patch({ template: e.target.value as "C" | "D" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="C">Šablona C</option>
            <option value="D">Šablona D</option>
          </select>
          {d.textSource === "ai" && <span className="text-xs text-purple-400">AI text</span>}
        </div>

        {d.template === "C" ? (
          <>
            <textarea value={d.headline} onChange={e => patch({ headline: e.target.value })}
              placeholder="Headline" rows={2} className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.sub} onChange={e => patch({ sub: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        ) : (
          <>
            <input value={d.words.join(", ")} onChange={e => patch({ words: e.target.value.split(",").map(w => w.trim()) })}
              placeholder="Slova oddělená čárkou" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.subHeadline} onChange={e => patch({ subHeadline: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        )}

        {/* fotky: výměna + focal point */}
        <div className="space-y-2">
          {d.photos.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryUrl(p.publicId, "w_64,h_64,c_fill,q_auto,f_auto")} alt="" className="w-8 h-8 object-cover" />
              <select value={p.publicId}
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, publicId: e.target.value } : pp) })}
                className="bg-zinc-900 border border-white/20 px-1 py-0.5 text-xs flex-1">
                {galleryPhotos.map(g => <option key={g.publicId} value={g.publicId}>{g.publicId}</option>)}
              </select>
              <label className="text-xs text-gray-500">x</label>
              <input type="range" min={0} max={100} value={p.x} className="w-16"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, x: +e.target.value } : pp) })} />
              <label className="text-xs text-gray-500">y</label>
              <input type="range" min={0} max={100} value={p.y} className="w-16"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, y: +e.target.value } : pp) })} />
              <button className="text-xs text-gray-500 hover:text-red-400"
                onClick={() => patch({ photos: d.photos.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          {d.photos.length < 6 && (
            <button className="text-xs border border-white/20 px-2 py-1"
              onClick={() => patch({ photos: [...d.photos, { publicId: galleryPhotos[0]?.publicId ?? "", x: 50, y: 50 }] })}>
              + fotka
            </button>
          )}
        </div>

        {/* akce */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
            className="bg-zinc-900 border border-white/20 px-2 py-1" />
          <button onClick={save} className="border border-white/20 px-3 py-1.5 hover:border-white/50">Uložit</button>
          <button onClick={approve} disabled={!publishAt || exporting || d.photos.length === 0}
            className="bg-amber-500 text-black px-3 py-1.5 font-medium disabled:opacity-30">
            {exporting ? `Renderuji… ${Math.round(progress * 100)}%` : "Schválit + naplánovat"}
          </button>
          <button onClick={remove} className="text-gray-500 hover:text-red-400 ml-auto">Zamítnout</button>
        </div>
      </div>

      {/* skrytý full-res kontejner pro export */}
      <div ref={exportRef} style={{
        position: "fixed", top: "-9999px", left: "-9999px",
        width: W, height: H, pointerEvents: "none", overflow: "hidden",
      }}>
        {d.template === "C"
          ? <TemplateC {...templateProps} headline={d.headline} sub={d.sub} scale={1} exportTick={exportTick} />
          : <TemplateD {...templateProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={1} exportTick={exportTick} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Ověř typy + build**

Run: `npx tsc --noEmit && npm run build`
Expected: build projde. (Pozn.: build může selhat na vercel.json cron ceště jen na Vercelu, lokálně ne.)

- [ ] **Step 6: Manuální ověření v prohlížeči**

Run: `npm run dev` → otevři `http://localhost:3000/admin/stories` (přihlaš se do adminu).
Ověř: záložky se přepínají, „+ Nový návrh" vytvoří kartu, přidání fotky zobrazí živé preview, focal slidery hýbou výřezem. Pokud běží bez KV env varů, GET vrací prázdná pole — UI nesmí spadnout.

- [ ] **Step 7: Commit**

```bash
git add app/admin/stories modules/stories/components modules/admin/components/AdminNav.tsx
git commit -m "feat(stories): admin UI with live preview, in-browser render and approve flow"
```

---

### Task 11: E-mail notifikace (volitelné, nice-to-have)

Resend přes plain fetch (žádná nová závislost). Přeskoč, pokud uživatel nechce řešit Resend účet — flow funguje i bez toho.

**Files:**
- Modify: `app/api/cron/stories-drafts/route.ts`

- [ ] **Step 1: Přidej odeslání e-mailu na konec cron handleru (před return)**

```typescript
  if (process.env.RESEND_API_KEY && drafts.length > 0) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Stories <stories@guthpictures.cz>",
          to: process.env.STORIES_NOTIFY_EMAIL,
          subject: `${drafts.length} nových návrhů stories ke schválení`,
          text: `Připraveno ${drafts.length} návrhů: https://guthpictures.cz/admin/stories`,
        }),
      });
    } catch (err) {
      console.error("[stories-drafts] email failed:", err);
    }
  }
```

Env: `RESEND_API_KEY`, `STORIES_NOTIFY_EMAIL` (bez nich se e-mail tiše přeskočí). Doménu `guthpictures.cz` ověř v Resend dashboardu — pokud se skutečná doména liší, uprav `from`.

- [ ] **Step 2: Commit**

```bash
git add app/api/cron/stories-drafts
git commit -m "feat(stories): optional email notification for new drafts"
```

---

### Task 12: Finální ověření + dokumentace

- [ ] **Step 1: Celá test suite + typy**

Run: `npm test && npx tsc --noEmit`
Expected: vše PASS.

- [ ] **Step 2: Doplň checklist nasazení do `docs/stories-ig-setup.md`**

Přidej sekci:

```markdown
## Nasazení — checklist

- [ ] Vercel env: IG_USER_ID, IG_ACCESS_TOKEN, FB_APP_ID, FB_APP_SECRET, CRON_SECRET, ANTHROPIC_API_KEY (+ volitelně RESEND_API_KEY, STORIES_NOTIFY_EMAIL)
- [ ] Spike proběhl úspěšně (scripts/ig-test-publish.ts) — PŘED zapnutím cronu
- [ ] Vercel Pro pro */15 cron, jinak externí trigger (cron-job.org) na /api/cron/stories-publish
- [ ] První ostrý průchod: ručně GET /api/cron/stories-drafts (s Bearer CRON_SECRET), schválit 1 návrh, ručně GET /api/cron/stories-publish, ověřit story na IG
- [ ] Naplnit zásobník textů v /admin/stories → Texty (aspoň 2× C, 2× D)
```

- [ ] **Step 3: Commit**

```bash
git add docs/stories-ig-setup.md
git commit -m "docs(stories): deployment checklist"
```

---

## Rizika známá předem (pro workera)

1. **IG akceptace videa** — kryto Task 2 spike. Pokud IG odmítne, zkusit Cloudinary transformaci `f_mp4,vc_h264` v `videoUrl()` v publish cronu; případně přidat tichou audio stopu (IG občas vyžaduje audio track) — řešit až kdyby spike selhal.
2. **`messages.parse` v SDK** — ověř přesnou signaturu podle nainstalované verze `@anthropic-ai/sdk`; fallback `messages.create` + `JSON.parse`.
3. **Vercel Hobby cron limit** — publish každých 15 min chce Pro; fallback externí trigger (zdokumentováno).
4. **KV konkurence** — read-modify-write bez zámku; jediný uživatel + cron, kolize nepravděpodobná. Neřešit, dokud se neprojeví.
5. **Stav tokenu v adminu** — vědomé zjednodušení oproti specu: samostatný indikátor stavu tokenu se nestaví; expirovaný token se projeví jako `failed` položka ve frontě s chybovou hláškou IG API. Doplnit, až kdyby to v praxi nestačilo.
6. **E-mail o selhání publikace** — vědomě nedodáno (spec ho zmiňuje); chyba je vidět ve frontě v adminu. Doplnit, až kdyby to nestačilo.
7. **AI texty a pondělní návrhy** — čerstvé AI texty jsou `approved: false`, do návrhů se dostanou až po schválení v záložce Texty (bezpečnější než spec formulace „schvaluje jako součást návrhu"). Záměr.
