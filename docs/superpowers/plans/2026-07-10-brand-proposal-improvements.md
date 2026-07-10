# Brand Proposal Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden and streamline the brand-shoot proposal flow: rate-limited client auth with 8-char passwords, fixed i18n, inline client feedback with concept pick, CLS/a11y fixes, loud parse validation, client-open + change-since-review tracking, bulk approve + inline concept text editing in admin, and a slimmer skill (Canva deck + local review gate removed).

**Architecture:** All web changes live in the existing `modules/brand-shoot` module + its API routes; KV record (`proposal:<slug>`) gains `feedback[]`, `firstOpenedAt/lastOpenedAt/reviewedAt`, and a per-concept `edited` flag that `upsertProposal` preserves across re-syncs. A new shared `lib/rate-limit.ts` (copy of the admin-login pattern, parameterized) guards proposal auth + feedback. The skill's SKILL.md loses Phases 6–8 (Canva deck, local review, local pages) — web admin is the single approval point.

**Tech Stack:** Next.js App Router, next-intl, Vercel KV, bcryptjs, vitest (jsdom; `server-only` already stubbed via alias; mock `@/lib/kv` with `vi.mock`).

**Baseline note:** 4 pre-existing vitest failures exist (jsdom lacks IntersectionObserver) — ~160 pass / 4 fail is the green baseline. There is no lint script.

**File map:**

| File | Change |
|---|---|
| `lib/rate-limit.ts` | Create — shared KV rate limiter |
| `lib/__tests__/rate-limit.test.ts` | Create |
| `app/api/proposal/[slug]/auth/route.ts` | Rate limit |
| `app/api/proposal/[slug]/feedback/route.ts` | Create — feedback endpoint |
| `app/api/admin/proposals/[slug]/route.ts` | Min password 8, `editConcept` action |
| `modules/brand-shoot/lib/types.ts` | `ProposalFeedback`, `edited`, tracking fields |
| `modules/brand-shoot/lib/proposals.ts` | `addFeedback`, `markOpened`, `markReviewed`, `editConcept`, upsert preservation |
| `modules/brand-shoot/lib/__tests__/proposals.test.ts` | Create |
| `modules/brand-shoot/components/ProposalGate.tsx` | Label, 429 handling |
| `modules/brand-shoot/components/ProposalView.tsx` | img dims/alt/lazy, feedback form in close section |
| `modules/brand-shoot/components/ProposalFeedbackForm.tsx` | Create |
| `modules/brand-shoot/components/AdminProposalReview.tsx` | Feedback display, bulk approve, edit form, min-8 msg |
| `modules/brand-shoot/components/AdminProposalList.tsx` | Feedback/changes/opened badges |
| `app/admin/navrhy/page.tsx` | New list fields |
| `app/admin/navrhy/[slug]/page.tsx` | `markReviewed` |
| `app/[locale]/navrh/[slug]/page.tsx` | `markOpened` |
| `messages/cs.json`, `messages/en.json` | Fix `gateLabel`/`heroLabel` (cs), new keys |
| `app/globals.css` | Feedback form styles (append near existing `.bsp-ed` block) |
| `tools/brand-shoot-prep/scripts/build-proposal-json.mjs` | Loud validation |
| `.claude/skills/brand-shoot-prep/SKILL.md` | Drop Canva deck + local review gate |

---

### Task 1: Shared rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Test: `lib/__tests__/rate-limit.test.ts`

The admin login route (`app/api/admin/login/route.ts:5-39`) has this logic inline; we extract a parameterized copy for new consumers. **Do NOT modify the admin login route** — surgical changes only.

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// No KV env vars in vitest and NODE_ENV !== "production" → in-memory fallback path.
describe("checkRateLimit (memory fallback)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to max attempts, then blocks", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await checkRateLimit("t1:1.2.3.4", 5, 900)).toBe(true);
    }
    expect(await checkRateLimit("t1:1.2.3.4", 5, 900)).toBe(false);
  });

  it("tracks keys independently", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("t2:a", 5, 900);
    expect(await checkRateLimit("t2:a", 5, 900)).toBe(false);
    expect(await checkRateLimit("t2:b", 5, 900)).toBe(true);
  });

  it("resets after the window", async () => {
    for (let i = 0; i < 6; i++) await checkRateLimit("t3:x", 5, 900);
    expect(await checkRateLimit("t3:x", 5, 900)).toBe(false);
    vi.advanceTimersByTime(901 * 1000);
    expect(await checkRateLimit("t3:x", 5, 900)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/rate-limit.test.ts`
Expected: FAIL — cannot resolve `@/lib/rate-limit`

- [ ] **Step 3: Implement**

```ts
// lib/rate-limit.ts
import "server-only";

// Fixed-window rate limit. KV-backed on Vercel; in-memory fallback for local dev.
// Production without working KV fails closed (better to block than bypass).
// Same pattern as app/api/admin/login/route.ts, parameterized for reuse.

const memAttempts = new Map<string, { count: number; resetAt: number }>();

function checkMemory(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = memAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    memAttempts.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function checkRateLimit(
  key: string,
  max = 5,
  windowSec = 15 * 60
): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    if (process.env.NODE_ENV === "production") return false;
    return checkMemory(key, max, windowSec);
  }
  try {
    const { kv } = await import("@vercel/kv");
    const kvKey = `ratelimit:${key}`;
    const count = await kv.incr(kvKey);
    if (count === 1) await kv.expire(kvKey, windowSec);
    return count <= max;
  } catch {
    if (process.env.NODE_ENV === "production") return false;
    return checkMemory(key, max, windowSec);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/rate-limit.test.ts`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts lib/__tests__/rate-limit.test.ts
git commit -m "feat(brand-shoot): shared KV rate limiter

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Rate-limit proposal auth + min password 8

**Files:**
- Modify: `app/api/proposal/[slug]/auth/route.ts`
- Modify: `app/api/admin/proposals/[slug]/route.ts:65-68`
- Modify: `modules/brand-shoot/components/AdminProposalReview.tsx:133-138`
- Modify: `modules/brand-shoot/components/ProposalGate.tsx:24-35`
- Modify: `messages/cs.json`, `messages/en.json` (add `tooManyAttempts`)

- [ ] **Step 1: Add rate limit to the auth route**

In `app/api/proposal/[slug]/auth/route.ts`, add the import and insert the check right after `const { slug } = await params;` (before the `getProposal` call, so unauthenticated spam never hits KV reads for the record more than needed):

```ts
import { checkRateLimit } from "@/lib/rate-limit";
```

```ts
  const { slug } = await params;

  // x-vercel-forwarded-for is set by Vercel infrastructure and cannot be spoofed by clients
  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await checkRateLimit(`proposal-auth:${slug}:${ip}`, 5, 15 * 60))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
```

- [ ] **Step 2: Min password 8 in admin PATCH route**

In `app/api/admin/proposals/[slug]/route.ts`, replace:

```ts
      if (typeof body.password !== "string" || body.password.length < 4) {
        return NextResponse.json({ error: "Password too short (min 4 chars)" }, { status: 400 });
      }
```

with:

```ts
      if (typeof body.password !== "string" || body.password.length < 8) {
        return NextResponse.json({ error: "Password too short (min 8 chars)" }, { status: 400 });
      }
```

- [ ] **Step 3: Min password 8 in admin UI**

In `AdminProposalReview.tsx` `savePassword`, replace:

```ts
    if (pw.length < 4) {
      setMsg("Heslo min. 4 znaky");
      return;
    }
```

with:

```ts
    if (pw.length < 8) {
      setMsg("Heslo min. 8 znaků");
      return;
    }
```

- [ ] **Step 4: Handle 429 in the gate**

In `ProposalGate.tsx` `handleSubmit`, after the 401 branch add:

```ts
      if (res.status === 429) {
        setError(t("tooManyAttempts"));
        return;
      }
```

Add to `messages/cs.json` `"brand-shoot"` block (after `"wrongPassword"` line):

```json
    "tooManyAttempts": "Příliš mnoho pokusů. Zkuste to znovu za 15 minut.",
```

Add to `messages/en.json` `"brand-shoot"` block (same position):

```json
    "tooManyAttempts": "Too many attempts. Try again in 15 minutes.",
```

- [ ] **Step 5: Verify build + tests**

Run: `npm test` → expected: baseline (~160 pass / 4 pre-existing fails, no new fails)
Run: `npx tsc --noEmit` → expected: no errors

- [ ] **Step 6: Commit**

```bash
git add app/api/proposal app/api/admin/proposals modules/brand-shoot/components/AdminProposalReview.tsx modules/brand-shoot/components/ProposalGate.tsx messages/cs.json messages/en.json
git commit -m "fix(brand-shoot): rate-limit proposal auth, min password 8

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: i18n fixes (Czech gate label, localized mail subject key)

**Files:**
- Modify: `messages/cs.json:127` + `heroLabel` line
- Modify: `messages/en.json` (add `ctaMailSubject`)

- [ ] **Step 1: Fix Czech labels**

In `messages/cs.json` `"brand-shoot"` block, replace:

```json
    "gateLabel": "Personal brand concept",
```
with:
```json
    "gateLabel": "Návrh focení",
```

and replace:
```json
    "heroLabel": "Personal brand concept",
```
with:
```json
    "heroLabel": "Návrh focení",
```

(English file keeps "Personal brand concept" — correct there.)

- [ ] **Step 2: Add localized mail subject key** (used by Task 5's close section)

`messages/cs.json` `"brand-shoot"` block, after `"ctaButton"` line:

```json
    "ctaMailSubject": "Návrh focení — {name}",
```

`messages/en.json`, same position:

```json
    "ctaMailSubject": "Shoot proposal — {name}",
```

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/cs.json','utf8')); JSON.parse(require('fs').readFileSync('messages/en.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add messages/cs.json messages/en.json
git commit -m "fix(brand-shoot): czech gate/hero labels, localized mail subject

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Types + lib — feedback, tracking, concept edits, upsert preservation

**Files:**
- Modify: `modules/brand-shoot/lib/types.ts`
- Modify: `modules/brand-shoot/lib/proposals.ts`
- Test: `modules/brand-shoot/lib/__tests__/proposals.test.ts`

- [ ] **Step 1: Extend types**

In `types.ts`, add to `ProposalConcept` (after the `status` field, line 31):

```ts
  edited?: boolean; // admin edited text fields in the web admin; sync must not overwrite them
```

Add after the `ProposalBrief` interface:

```ts
export interface ProposalFeedback {
  conceptId?: string; // concept the client picked as favourite (optional)
  message: string;
  createdAt: string;
}
```

Add to `ProposalRecord` (after `syncedAt?: string;`):

```ts
  feedback?: ProposalFeedback[]; // client reactions from the proposal page
  firstOpenedAt?: string; // first time the client viewed the proposal (valid session)
  lastOpenedAt?: string;
  reviewedAt?: string; // last time the admin opened the review screen
```

- [ ] **Step 2: Write the failing tests**

```ts
// modules/brand-shoot/lib/__tests__/proposals.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory KV mock shared by all lib functions.
const store = new Map<string, unknown>();
const sets = new Map<string, Set<string>>();
vi.mock("@/lib/kv", () => ({
  getKv: async () => ({
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: unknown) => void store.set(k, v),
    del: async (k: string) => void store.delete(k),
    smembers: async (k: string) => [...(sets.get(k) ?? [])],
    sadd: async (k: string, v: string) => void (sets.get(k) ?? sets.set(k, new Set()).get(k)!).add(v),
    srem: async (k: string, v: string) => void sets.get(k)?.delete(v),
  }),
}));

import {
  upsertProposal,
  addFeedback,
  markOpened,
  markReviewed,
  editConcept,
} from "@/modules/brand-shoot/lib/proposals";
import type { ProposalSyncPayload, ProposalRecord } from "@/modules/brand-shoot/lib/types";

function payload(): ProposalSyncPayload {
  return {
    slug: "test-client",
    name: "Test Client",
    locale: "cs",
    brief: { date: "2026-07-10" },
    research: "internal",
    concepts: [
      {
        id: "A",
        title: "Original title",
        pitch: "Original pitch",
        why: "why",
        mood: "mood",
        palettes: [{ id: "a-p1", name: "P1", colors: ["#111111"], status: "pending" }],
        wardrobe: "w",
        location: "l",
        lighting: "li",
        shotList: [],
        poseDirection: "pd",
        status: "pending",
      },
    ],
    moodboard: [],
    poses: [],
  };
}

const rec = () => store.get("proposal:test-client") as ProposalRecord;

beforeEach(() => {
  store.clear();
  sets.clear();
});

describe("proposal lib", () => {
  it("editConcept updates fields and sets edited flag", async () => {
    await upsertProposal(payload());
    const updated = await editConcept("test-client", "A", { title: "Edited title", pitch: "Edited pitch" });
    expect(updated?.concepts[0].title).toBe("Edited title");
    expect(updated?.concepts[0].pitch).toBe("Edited pitch");
    expect(updated?.concepts[0].edited).toBe(true);
    expect(updated?.concepts[0].why).toBe("why"); // untouched field survives
  });

  it("upsert preserves admin-edited concept text across re-syncs", async () => {
    await upsertProposal(payload());
    await editConcept("test-client", "A", { title: "Edited title" });
    await upsertProposal(payload()); // re-sync with original text
    expect(rec().concepts[0].title).toBe("Edited title");
    expect(rec().concepts[0].edited).toBe(true);
  });

  it("upsert overwrites text of non-edited concepts", async () => {
    await upsertProposal(payload());
    const p2 = payload();
    p2.concepts[0].title = "New synced title";
    await upsertProposal(p2);
    expect(rec().concepts[0].title).toBe("New synced title");
  });

  it("addFeedback appends, validates nothing extra, and survives re-sync", async () => {
    await upsertProposal(payload());
    expect(await addFeedback("test-client", { conceptId: "A", message: "Love it" })).toBe(true);
    expect(rec().feedback).toHaveLength(1);
    expect(rec().feedback![0].message).toBe("Love it");
    expect(rec().feedback![0].createdAt).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().feedback).toHaveLength(1);
  });

  it("addFeedback caps at 50 entries", async () => {
    await upsertProposal(payload());
    for (let i = 0; i < 55; i++) await addFeedback("test-client", { message: `m${i}` });
    expect(rec().feedback).toHaveLength(50);
    expect(rec().feedback![49].message).toBe("m54");
  });

  it("markOpened sets firstOpenedAt once, lastOpenedAt always; survives re-sync", async () => {
    await upsertProposal(payload());
    await markOpened("test-client");
    const first = rec().firstOpenedAt;
    expect(first).toBeTruthy();
    await markOpened("test-client");
    expect(rec().firstOpenedAt).toBe(first);
    expect(rec().lastOpenedAt).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().firstOpenedAt).toBe(first);
  });

  it("markReviewed sets reviewedAt and survives re-sync", async () => {
    await upsertProposal(payload());
    await markReviewed("test-client");
    const at = rec().reviewedAt;
    expect(at).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().reviewedAt).toBe(at);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run modules/brand-shoot/lib/__tests__/proposals.test.ts`
Expected: FAIL — `addFeedback` etc. not exported

- [ ] **Step 4: Implement in `proposals.ts`**

4a. In `upsertProposal`, after the `paletteStatus` map (line ~70), add:

```ts
  // Admin-edited concept text (web-managed) wins over incoming sync text.
  const editedConcepts = new Map(
    (existing?.concepts ?? []).filter((c) => c.edited).map((c) => [c.id, c])
  );
```

4b. In the `concepts: payload.concepts.map((c) => { ... })` return object, merge edited text. Replace the whole `return { ... }` inside the map with:

```ts
      const prevEdit = editedConcepts.get(c.id);
      return {
        ...c,
        ...(prevEdit
          ? {
              title: prevEdit.title,
              pitch: prevEdit.pitch,
              why: prevEdit.why,
              mood: prevEdit.mood,
              wardrobe: prevEdit.wardrobe,
              location: prevEdit.location,
              lighting: prevEdit.lighting,
              poseDirection: prevEdit.poseDirection,
              edited: true as const,
            }
          : {}),
        status: conceptStatus.get(c.id) ?? c.status,
        palettes,
        chosenPaletteId: palettes.some((p) => p.id === chosen) ? chosen : undefined,
      };
```

4c. In the `record` object literal, after `createdAt`/`syncedAt` lines, add:

```ts
    feedback: existing?.feedback,
    firstOpenedAt: existing?.firstOpenedAt,
    lastOpenedAt: existing?.lastOpenedAt,
    reviewedAt: existing?.reviewedAt,
```

4d. Append new functions at the end of the file (before `toPublicProposal` is fine too — put them after `deleteProposal`):

```ts
// Client reaction from the proposal page. Capped so a stuck client can't grow the record forever.
export async function addFeedback(
  slug: string,
  entry: { conceptId?: string; message: string }
): Promise<boolean> {
  const kv = await getKv();
  if (!kv) return false;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return false;
  const feedback = [
    ...(record.feedback ?? []),
    { ...entry, createdAt: new Date().toISOString() },
  ].slice(-50);
  await kv.set(key(slug), { ...record, feedback });
  return true;
}

export async function markOpened(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return;
  const now = new Date().toISOString();
  await kv.set(key(slug), {
    ...record,
    firstOpenedAt: record.firstOpenedAt ?? now,
    lastOpenedAt: now,
  });
}

export async function markReviewed(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return;
  await kv.set(key(slug), { ...record, reviewedAt: new Date().toISOString() });
}

export type ConceptTextFields = Partial<
  Pick<
    import("./types").ProposalConcept,
    "title" | "pitch" | "why" | "mood" | "wardrobe" | "location" | "lighting" | "poseDirection"
  >
>;

// Admin inline text edit; sets `edited` so upsert preserves it across re-syncs.
export async function editConcept(
  slug: string,
  conceptId: string,
  fields: ConceptTextFields
): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return null;
  const updated: ProposalRecord = {
    ...record,
    concepts: record.concepts.map((c) =>
      c.id === conceptId ? { ...c, ...fields, edited: true } : c
    ),
  };
  await kv.set(key(slug), updated);
  return updated;
}
```

(If the inline `import("./types")` type reads awkwardly, add `ProposalConcept` to the existing type import at the top instead — it's already imported in the file's type list? Check: line 4-10 imports `ProposalRecord, ProposalSyncPayload, ProposalStatus, ProposalPublic, ProposalImage`. Add `ProposalConcept` there and write `Pick<ProposalConcept, ...>` directly.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run modules/brand-shoot/lib/__tests__/proposals.test.ts`
Expected: 7 passed

- [ ] **Step 6: Commit**

```bash
git add modules/brand-shoot/lib
git commit -m "feat(brand-shoot): feedback, open/review tracking, concept edits in proposal lib

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Feedback API route + client form + close-section rewire

**Files:**
- Create: `app/api/proposal/[slug]/feedback/route.ts`
- Create: `modules/brand-shoot/components/ProposalFeedbackForm.tsx`
- Modify: `modules/brand-shoot/components/ProposalView.tsx:199-208` (close section)
- Modify: `messages/cs.json`, `messages/en.json` (feedback keys)
- Modify: `app/globals.css` (append after the existing `.bsp-ed` style block — find it via `grep -n "bsp-ed-cta" app/globals.css`)

- [ ] **Step 1: API route**

```ts
// app/api/proposal/[slug]/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProposal, addFeedback } from "@/modules/brand-shoot/lib/proposals";
import { verifyProposalToken, proposalCookieName } from "@/modules/brand-shoot/lib/proposal-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  // Only clients with a valid proposal session may submit.
  const token = request.cookies.get(proposalCookieName(slug))?.value;
  if (!token || !(await verifyProposalToken(token, slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await checkRateLimit(`proposal-feedback:${slug}:${ip}`, 10, 60 * 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { conceptId?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Message required (max 2000 chars)" }, { status: 400 });
  }

  const proposal = await getProposal(slug);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conceptId =
    typeof body.conceptId === "string" && proposal.concepts.some((c) => c.id === body.conceptId)
      ? body.conceptId
      : undefined;

  if (!(await addFeedback(slug, { conceptId, message }))) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  notifyFormspree(proposal.name, conceptId, message);
  return NextResponse.json({ ok: true });
}

// Fire-and-forget email notification through the same Formspree form the contact page uses.
function notifyFormspree(name: string, conceptId: string | undefined, message: string) {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
  if (!formId) return;
  fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `Reakce na návrh — ${name}`,
      concept: conceptId ?? "—",
      message,
    }),
  }).catch(() => {});
}
```

- [ ] **Step 2: Client form component**

```tsx
// modules/brand-shoot/components/ProposalFeedbackForm.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

export function ProposalFeedbackForm({
  slug,
  concepts,
}: {
  slug: string;
  concepts: { id: string; title: string }[];
}) {
  const t = useTranslations("brand-shoot");
  const [conceptId, setConceptId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`/api/proposal/${slug}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conceptId: conceptId ?? undefined, message }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="bsp-fb-success" role="alert" aria-live="polite">
        {t("feedbackSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bsp-fb">
      {concepts.length > 0 && (
        <div className="bsp-fb-pills" role="group" aria-label={t("feedbackPrompt")}>
          <span className="gp-label">{t("feedbackPrompt")}</span>
          <div>
            {concepts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConceptId(conceptId === c.id ? null : c.id)}
                className={`bsp-fb-pill${conceptId === c.id ? " is-active" : ""}`}
                aria-pressed={conceptId === c.id}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}
      <label htmlFor="bsp-fb-message" className="gp-label">
        {t("feedbackLabel")}
      </label>
      <textarea
        id="bsp-fb-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        required
        maxLength={2000}
        placeholder={t("feedbackPlaceholder")}
        className="bsp-fb-text"
      />
      {status === "error" && (
        <p className="bsp-error" role="alert">
          {t("feedbackError")}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending" || !message.trim()}
        className="bsp-ed-cta"
      >
        {status === "sending" ? t("feedbackSending") : t("feedbackSend")} →
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Rewire the close section in `ProposalView.tsx`**

Add import at top:

```tsx
import { ProposalFeedbackForm } from "./ProposalFeedbackForm";
```

Replace the CLOSE section (lines 199-208):

```tsx
      {/* CLOSE */}
      <section className="bsp-ed-close" {...brandPal}>
        <div className="bsp-ed-close-inner" data-reveal>
          <span className="bsp-ed-eyebrow-accent">{t("ctaTitle")}</span>
          <h2 className="bsp-ed-close-h">{t("ctaBody")}</h2>
          <ProposalFeedbackForm
            slug={proposal.slug}
            concepts={concepts.map((c) => ({ id: c.id, title: c.title }))}
          />
          <a
            className="bsp-ed-cta-alt"
            href={`mailto:ahoj@guthpictures.eu?subject=${encodeURIComponent(t("ctaMailSubject", { name: proposal.name }))}`}
          >
            {t("ctaButton")} →
          </a>
        </div>
      </section>
```

- [ ] **Step 4: i18n keys**

`messages/cs.json` `"brand-shoot"` block, after `"ctaMailSubject"` line:

```json
    "feedbackPrompt": "Který koncept vás oslovil?",
    "feedbackLabel": "Vzkaz pro mě",
    "feedbackPlaceholder": "Napište pár slov — co se líbí, co byste změnili…",
    "feedbackSend": "Odeslat",
    "feedbackSending": "Odesílám…",
    "feedbackSuccess": "Díky! Ozvu se vám co nejdřív.",
    "feedbackError": "Odeslání se nepovedlo. Zkuste to znovu, nebo napište e-mail.",
```

`messages/en.json`, same position:

```json
    "feedbackPrompt": "Which concept speaks to you?",
    "feedbackLabel": "Your message",
    "feedbackPlaceholder": "A few words — what you like, what you'd change…",
    "feedbackSend": "Send",
    "feedbackSending": "Sending…",
    "feedbackSuccess": "Thank you! I'll get back to you shortly.",
    "feedbackError": "Sending failed. Try again, or send an email instead.",
```

- [ ] **Step 5: Styles**

First run `grep -n "bsp-ed-cta\b" app/globals.css` to find the existing close-section styles and confirm which CSS vars the CTA uses (expected: `var(--p-accent)` for background and a contrast var for text — reuse exactly what `.bsp-ed-cta` uses). Append after that block:

```css
/* Proposal feedback form (close section) */
.bsp-fb { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 34rem; margin: 2.5rem auto 0; text-align: left; }
.bsp-fb-pills > div { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 0.5rem; margin-top: 0.6rem; }
.bsp-fb-pill { border: 1px solid color-mix(in srgb, var(--p-accent) 45%, transparent); background: transparent; color: inherit; padding: 0.5rem 1.1rem; border-radius: 9999px; font-size: 0.9rem; cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
.bsp-fb-pill.is-active { background: var(--p-accent); border-color: var(--p-accent); color: var(--bsp-ed-cta-fg, #0a0a0b); }
.bsp-fb-text { background: color-mix(in srgb, currentColor 6%, transparent); border: 1px solid color-mix(in srgb, currentColor 22%, transparent); color: inherit; padding: 0.9rem 1rem; border-radius: var(--radius-md); font: inherit; resize: vertical; }
.bsp-fb-text:focus { outline: none; border-color: var(--p-accent); }
.bsp-fb .bsp-ed-cta { align-self: flex-start; border: 0; cursor: pointer; }
.bsp-fb-success { font-size: 1.15rem; margin-top: 2.5rem; }
.bsp-ed-cta-alt { display: inline-block; margin-top: 1.5rem; font-size: 0.9rem; opacity: 0.7; text-decoration: underline; text-underline-offset: 3px; }
.bsp-ed-cta-alt:hover { opacity: 1; }
```

`--bsp-ed-cta-fg` is a guess for the CTA text color var — replace it with whatever `.bsp-ed-cta` actually uses for its text color (found in the grep above). The submit button reuses `.bsp-ed-cta`, but it's a `<button>` now, hence the `border: 0; cursor: pointer` override.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit` → no errors
Run: `npm test` → baseline
Manual: `npm run dev`, open a synced proposal (if one exists in local KV), check the close section renders the form and pills recolor with the palette. If no local proposal exists, skip manual check — noted for the verify pass at the end.

- [ ] **Step 7: Commit**

```bash
git add app/api/proposal modules/brand-shoot/components messages app/globals.css
git commit -m "feat(brand-shoot): inline client feedback with concept pick

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: CLS + a11y fixes on the client page

**Files:**
- Modify: `modules/brand-shoot/components/ProposalView.tsx:63-70, 95-103`
- Modify: `modules/brand-shoot/components/ProposalGate.tsx:44-66`

- [ ] **Step 1: Image dimensions + lazy heroes + alt fallbacks**

In `ProposalView.tsx` `ConceptSection`, replace the hero `<img>` (line 66):

```tsx
              <img
                className="bsp-ed-portrait-img"
                src={img(hero.cloudinaryId, 1100)}
                alt={hero.note || concept.title}
                width={hero.width}
                height={hero.height}
                loading="lazy"
              />
```

(All concept sections sit below the 100vh opening section, so lazy heroes don't hurt LCP.)

Replace the moodboard `<img>` (line 99):

```tsx
              <img
                src={img(m.cloudinaryId, 700)}
                alt={m.note || concept.title}
                width={m.width}
                height={m.height}
                loading="lazy"
              />
```

`width`/`height` come from the Cloudinary upload response stored on `ProposalImage` (types.ts:36-37). The CSS `aspect-ratio` + `object-fit` rules still control layout; the attributes just give the browser intrinsic dimensions before fetch.

- [ ] **Step 2: Associate the gate password input with a label**

In `ProposalGate.tsx`, replace:

```tsx
        <p className="gp-body-md">{t("gatePrompt")}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          autoFocus
          required
          className="bsp-input"
        />
```

with:

```tsx
        <label htmlFor="bsp-gate-password" className="gp-body-md">{t("gatePrompt")}</label>
        <input
          id="bsp-gate-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          autoFocus
          required
          className="bsp-input"
        />
```

Check the `.bsp-gate` CSS: if the old `<p class="gp-body-md">` relied on `p` display styles, the `<label>` may need `display: block`. Run `grep -n "bsp-gate" app/globals.css` and add `.bsp-gate label { display: block; }` only if the layout actually needs it.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` → no errors
Run: `npm test` → baseline

- [ ] **Step 4: Commit**

```bash
git add modules/brand-shoot/components app/globals.css
git commit -m "fix(brand-shoot): image dimensions for CLS, alt fallbacks, labeled gate input

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Open + review tracking wired into pages, badges in admin list

**Files:**
- Modify: `app/[locale]/navrh/[slug]/page.tsx:43-47`
- Modify: `app/admin/navrhy/[slug]/page.tsx:13-15`
- Modify: `app/admin/navrhy/page.tsx:12-21`
- Modify: `modules/brand-shoot/components/AdminProposalList.tsx`

- [ ] **Step 1: Mark opened on client view**

In `app/[locale]/navrh/[slug]/page.tsx`, extend the proposals import:

```tsx
import { getProposal, isExpired, toPublicProposal, markOpened } from "@/modules/brand-shoot/lib/proposals";
```

Replace the final render block:

```tsx
  if (!(await hasSession(slug))) {
    return <ProposalGate slug={slug} clientName={proposal.name} />;
  }

  await markOpened(slug);
  return <ProposalView proposal={toPublicProposal(proposal)} />;
```

- [ ] **Step 2: Mark reviewed on admin detail view**

In `app/admin/navrhy/[slug]/page.tsx`:

```tsx
import { getProposal, markReviewed } from "@/modules/brand-shoot/lib/proposals";
```

After `if (!proposal) notFound();` add:

```tsx
  await markReviewed(slug);
```

(Marking on load intentionally clears the "changes since review" badge — opening the review IS the review.)

- [ ] **Step 3: New list fields**

In `app/admin/navrhy/page.tsx`, extend the mapped object:

```tsx
        proposals={proposals.map((p) => ({
          slug: p.slug,
          name: p.name,
          locale: p.locale,
          finalized: p.finalized,
          hasPassword: !!p.passwordHash,
          approvedConcepts: p.concepts.filter((c) => c.status === "approved").length,
          conceptCount: p.concepts.length,
          syncedAt: p.syncedAt,
          feedbackCount: p.feedback?.length ?? 0,
          firstOpenedAt: p.firstOpenedAt,
          hasNewChanges: !!p.syncedAt && (!p.reviewedAt || p.syncedAt > p.reviewedAt),
        }))}
```

(ISO-8601 strings compare correctly with `>`.)

- [ ] **Step 4: Badges in `AdminProposalList.tsx`**

Extend the interface:

```tsx
interface ListItem {
  slug: string;
  name: string;
  locale: string;
  finalized: boolean;
  hasPassword: boolean;
  approvedConcepts: number;
  conceptCount: number;
  syncedAt?: string;
  feedbackCount: number;
  firstOpenedAt?: string;
  hasNewChanges: boolean;
}
```

Replace the meta line (lines 44-47):

```tsx
                <div className="text-xs text-gray-500 mt-0.5">
                  {p.approvedConcepts}/{p.conceptCount} konceptů schváleno
                  {p.syncedAt && ` · sync ${new Date(p.syncedAt).toLocaleDateString("cs-CZ")}`}
                  {p.firstOpenedAt &&
                    ` · klient otevřel ${new Date(p.firstOpenedAt).toLocaleDateString("cs-CZ")}`}
                </div>
```

In the right-side badge cluster, add before the password badge:

```tsx
                {p.hasNewChanges && (
                  <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300">nové změny</span>
                )}
                {p.feedbackCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300">💬 {p.feedbackCount}</span>
                )}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors
Run: `npm test` → baseline

- [ ] **Step 6: Commit**

```bash
git add app/admin/navrhy "app/[locale]/navrh" modules/brand-shoot/components/AdminProposalList.tsx
git commit -m "feat(brand-shoot): client-open tracking + change/feedback badges in admin

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Admin review — feedback display, bulk approve, inline concept edit

**Files:**
- Modify: `app/api/admin/proposals/[slug]/route.ts` (new `editConcept` action)
- Modify: `modules/brand-shoot/components/AdminProposalReview.tsx`

- [ ] **Step 1: `editConcept` PATCH action**

In `app/api/admin/proposals/[slug]/route.ts`, extend the proposals import:

```ts
import {
  getProposal,
  setApprovals,
  setAssignments,
  setFinalized,
  setPassword,
  deleteProposal,
  editConcept,
  type ApprovalPatch,
  type AssignmentPatch,
  type ConceptTextFields,
} from "@/modules/brand-shoot/lib/proposals";
```

Extend the `body` type:

```ts
  let body: {
    action?: unknown;
    patch?: ApprovalPatch & AssignmentPatch;
    finalized?: unknown;
    password?: unknown;
    expiryDays?: unknown;
    conceptId?: unknown;
    fields?: unknown;
  };
```

Add a case before `default:`:

```ts
    case "editConcept": {
      const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
      const allowed = [
        "title", "pitch", "why", "mood", "wardrobe", "location", "lighting", "poseDirection",
      ] as const;
      const raw = (body.fields ?? {}) as Record<string, unknown>;
      const fields: ConceptTextFields = {};
      for (const k of allowed) {
        if (typeof raw[k] === "string") fields[k] = (raw[k] as string).trim();
      }
      if (!conceptId || (fields.title !== undefined && !fields.title)) {
        return NextResponse.json({ error: "conceptId and non-empty title required" }, { status: 400 });
      }
      const updated = await editConcept(slug, conceptId, fields);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ proposal: updated });
    }
```

- [ ] **Step 2: Bulk approve in `AdminProposalReview.tsx`**

Add next to the other handlers (after `toggleImage`):

```tsx
  // Approve every pending item in one PATCH — saves click-per-item on fresh syncs.
  async function approveAllPending(kind: "concepts" | "moodboard" | "poses") {
    if (kind === "concepts") {
      const pend = concepts.filter((c) => c.status === "pending");
      if (!pend.length) return;
      setConcepts((prev) => prev.map((c) => (c.status === "pending" ? { ...c, status: "approved" } : c)));
      await patch({
        action: "approvals",
        patch: { concepts: Object.fromEntries(pend.map((c) => [c.id, "approved"])) },
      });
      return;
    }
    const [items, setter] = kind === "moodboard"
      ? ([moodboard, setMoodboard] as const)
      : ([poses, setPoses] as const);
    const pend = items.filter((i) => i.status === "pending");
    if (!pend.length) return;
    setter((prev) => prev.map((i) => (i.status === "pending" ? { ...i, status: "approved" } : i)));
    await patch({
      action: "approvals",
      patch: { [kind]: Object.fromEntries(pend.map((i) => [i.cloudinaryId, "approved"])) },
    });
  }
```

Add a small header component pattern: replace each of the three section `<h2>` lines ("Koncepty", "Moodboard", "Pózy") with a flex row. Example for concepts (repeat with the right kind + pending count for the other two sections):

```tsx
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Koncepty</h2>
          {concepts.some((c) => c.status === "pending") && (
            <button
              onClick={() => approveAllPending("concepts")}
              disabled={busy}
              className="text-xs px-2 py-1 border border-green-500/40 text-green-300 hover:bg-green-900/30"
            >
              Schválit vše ({concepts.filter((c) => c.status === "pending").length})
            </button>
          )}
        </div>
```

For moodboard: `moodboard.some((i) => i.status === "pending")`, `approveAllPending("moodboard")`, count from `moodboard`. For poses likewise.

- [ ] **Step 3: Inline concept text edit**

Add a top-level component in the same file, ABOVE `AdminProposalReview` (top-level, not nested — nested definitions remount and lose draft state when the parent re-renders):

```tsx
const EDIT_FIELDS = [
  ["title", "Titul"],
  ["pitch", "Pitch"],
  ["why", "Proč"],
  ["mood", "Nálada"],
  ["wardrobe", "Oblečení"],
  ["location", "Místo"],
  ["lighting", "Světlo"],
  ["poseDirection", "Pózování"],
] as const;

type EditableField = (typeof EDIT_FIELDS)[number][0];

function ConceptEditForm({
  concept,
  busy,
  onSave,
  onCancel,
}: {
  concept: ProposalConcept;
  busy: boolean;
  onSave: (fields: Record<EditableField, string>) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(
    () => Object.fromEntries(EDIT_FIELDS.map(([k]) => [k, concept[k] ?? ""])) as Record<EditableField, string>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="ml-4 space-y-2 border-l border-zinc-800 pl-4 py-2"
    >
      {EDIT_FIELDS.map(([k, label]) => (
        <label key={k} className="block text-xs text-gray-400">
          {label}
          <textarea
            value={draft[k]}
            onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
            rows={k === "title" ? 1 : 2}
            required={k === "title"}
            className="mt-0.5 w-full bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-white resize-y"
          />
        </label>
      ))}
      <div className="flex gap-2">
        <button disabled={busy} className="px-3 py-1 bg-white text-black text-xs font-medium disabled:opacity-40">
          Uložit texty
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1 text-xs text-gray-400 hover:text-white">
          Zrušit
        </button>
      </div>
    </form>
  );
}
```

Inside `AdminProposalReview`, add state + handler:

```tsx
  const [editingConcept, setEditingConcept] = useState<string | null>(null);

  async function saveConceptEdit(conceptId: string, fields: Record<EditableField, string>) {
    if (await patch({ action: "editConcept", conceptId, fields })) {
      setConcepts((prev) =>
        prev.map((c) => (c.id === conceptId ? { ...c, ...fields, edited: true } : c))
      );
      setEditingConcept(null);
    }
  }
```

In the concepts map (inside `<div key={c.id} className="space-y-2">`), after the approval `<button>` and before the palettes block, add:

```tsx
              <div className="flex items-center gap-3 ml-4">
                <button
                  onClick={() => setEditingConcept(editingConcept === c.id ? null : c.id)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {editingConcept === c.id ? "Zavřít úpravy" : "Upravit texty"}
                </button>
                {c.edited && <span className="text-[10px] uppercase text-amber-400">upraveno</span>}
              </div>
              {editingConcept === c.id && (
                <ConceptEditForm
                  concept={c}
                  busy={busy}
                  onSave={(fields) => saveConceptEdit(c.id, fields)}
                  onCancel={() => setEditingConcept(null)}
                />
              )}
```

- [ ] **Step 4: Client feedback display**

In `AdminProposalReview`'s returned JSX, after the Password section and before Concepts, add:

```tsx
      {/* Client feedback */}
      {(proposal.feedback?.length ?? 0) > 0 && (
        <section className="border border-blue-500/20 p-4 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
            Reakce klienta ({proposal.feedback!.length})
          </h2>
          {proposal.feedback!.map((f, i) => (
            <div key={i} className="text-sm border-l-2 border-blue-400/40 pl-3">
              <p className="text-xs text-gray-500">
                {new Date(f.createdAt).toLocaleString("cs-CZ")}
                {f.conceptId && (
                  <span className="ml-2 text-amber-300">
                    ♥ koncept {f.conceptId} — {concepts.find((c) => c.id === f.conceptId)?.title}
                  </span>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-gray-200">{f.message}</p>
            </div>
          ))}
        </section>
      )}
```

Also in the header block (under the `{proposal.slug} · {locale}` line), add client-open info:

```tsx
          {proposal.firstOpenedAt && (
            <p className="text-xs text-gray-500">
              klient otevřel {new Date(proposal.firstOpenedAt).toLocaleString("cs-CZ")}
            </p>
          )}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` → no errors
Run: `npm test` → baseline

- [ ] **Step 6: Commit**

```bash
git add app/api/admin modules/brand-shoot/components/AdminProposalReview.tsx
git commit -m "feat(brand-shoot): admin bulk approve, inline concept edit, feedback display

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Loud validation in build-proposal-json.mjs

**Files:**
- Modify: `tools/brand-shoot-prep/scripts/build-proposal-json.mjs` (inside `buildProposalJson`, after `parsedConcepts` is built, line ~173)

- [ ] **Step 1: Add validation**

After the `parsedConcepts` mapping in `buildProposalJson`, insert:

```js
  // Fail loudly when parsing yields nothing — a malformed heading otherwise syncs an
  // empty proposal (e.g. curly quotes in `## Concept A — "Title"` broke this before).
  if (!parsedConcepts.length) {
    const headings = approachesMd.split("\n").filter((l) => /^##\s/.test(l));
    throw new Error(
      `No concepts parsed from ${join(dir, "approaches.md")}.\n` +
        `Expected H2 headings like: ## Concept A — "Title" (straight quotes, em dash).\n` +
        (headings.length
          ? `Found H2 headings:\n${headings.map((h) => `  ${h}`).join("\n")}`
          : "No H2 headings found at all — is approaches.md present and non-empty?")
    );
  }
  const paletteless = parsedConcepts.filter((c) => !c.palettes.length);
  if (paletteless.length) {
    throw new Error(
      `Concept(s) without palettes: ${paletteless.map((c) => c.id).join(", ")} (approaches.md).\n` +
        `Each concept needs a "- **Palety:**" bullet with an INDENTED sub-list, e.g.:\n` +
        `  - **Palety:**\n` +
        "    - **Hřejivá:** `#1f1d1b` `#6b5d4f` `#b9a88f` `#e8e2d8`"
    );
  }
```

- [ ] **Step 2: Verify with throwaway fixtures**

```bash
cd tools/brand-shoot-prep
mkdir -p /tmp/bpj-bad
printf '# Bad Client\n**Locale:** cs\n' > /tmp/bpj-bad/brief.md
printf '## Koncept A - "Curly"\n- **Mood:** x\n' > /tmp/bpj-bad/approaches.md
node scripts/build-proposal-json.mjs /tmp/bpj-bad; echo "exit: $?"
```

Expected: error message listing the found `## Koncept A - "Curly"` heading and the expected format; `exit: 1`.

```bash
mkdir -p /tmp/bpj-nopal
printf '# NoPal Client\n**Locale:** cs\n' > /tmp/bpj-nopal/brief.md
printf '## Concept A — "Fine"\n- **Mood:** x\n' > /tmp/bpj-nopal/approaches.md
node scripts/build-proposal-json.mjs /tmp/bpj-nopal; echo "exit: $?"
```

Expected: "Concept(s) without palettes: A" with the format example; `exit: 1`.

Then a happy path against a real existing client folder (pick any under `clients/`):

```bash
ls clients/ | head -3
node scripts/build-proposal-json.mjs clients/<existing-slug>
```

Expected: `✓ proposal.json written` with non-zero concept + palette counts.

Cleanup: `rm -rf /tmp/bpj-bad /tmp/bpj-nopal`

- [ ] **Step 3: Commit**

```bash
git add tools/brand-shoot-prep/scripts/build-proposal-json.mjs
git commit -m "feat(brand-shoot-prep): fail loudly on unparseable concepts/palettes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Slim the skill — drop Canva deck + local review gate

**Files:**
- Modify: `.claude/skills/brand-shoot-prep/SKILL.md`

The web proposal is now the sole client deliverable and the web admin the sole approval point. Canva stays ONLY as the pose-sketch generator (Phase 5 / pose-sketch-style.md) — it generates line-art sketches, that's generation, not the deck. Remove: Phase 6 (presentation deck), Phase 7 (local review gate), Phase 8 (local client pages), Canva board assembly in Phases 4–5, and the "Canva assembly (MCP)" section's board/deck content.

- [ ] **Step 1: Frontmatter + intro**

Replace the frontmatter `description` with:

```yaml
description: >-
  Prep a brand photo shoot end-to-end from a client name / LinkedIn / website:
  deep client research, three distinct shoot concepts, a moodboard and a pose board
  (library-first references + AI-generated sketches), synced to a password-gated
  client proposal page on the website. Use when the user wants to prepare, research,
  pitch, or storyboard a brand / personal-branding / founder / headshot photo shoot,
  or invokes /brandshoot.
```

Replace the intro paragraph (lines 14-16):

```markdown
Turn a client identity (name / LinkedIn / website) into a complete, client-ready shoot
proposal hosted on the website. You own the whole pipeline; the photographer just supplies
the identity and makes one creative call along the way (which concepts/palettes to board) —
final approval happens in the web admin.
```

- [ ] **Step 2: Phase 4 — remove Canva board step**

In "Phase 4 — Moodboard", delete step 4 (the whole `4. **Canva:** …` item ending with `See "Canva assembly" below.`). Steps 1-3 stay.

- [ ] **Step 3: Phase 5 — keep Canva only as sketch generator**

In "Phase 5 — Pose board", step 3, replace:

```markdown
3. Build `clients/<slug>/poseboard.html` with `build-board.mjs` and assemble a Canva pose
   board as in Phase 4. Pose direction notes ride along from the library/`sources.json` notes.
```

with:

```markdown
3. Build `clients/<slug>/poseboard.html` with `build-board.mjs`. Pose direction notes ride
   along from the library/`sources.json` notes.
```

- [ ] **Step 4: Delete Phases 6–8, promote publish**

Delete these three sections entirely:
- `## Phase 6 — Presentation (Canva → PDF)` (including Decision point 2)
- `## Phase 7 — Prep & approval (review gate)`
- `## Phase 8 — Client pages (build hub + all-clients gallery)`

Rename `## Phase 9 — Publish (sync to the website)` to `## Phase 6 — Publish (sync to the website)` and replace its intro paragraph + post-sync bullet to make web admin the approval point:

```markdown
The proposal is hosted **remotely on the guth-pictures website**. Sync pushes the structured
proposal + images to the site; **all approval happens in the web admin** (concepts, images,
palette choice), then the photographer sets a password, finalizes, and hands the client a
URL + password. The client page has an inline feedback form (concept pick + message), so
client reactions land back in the admin.
```

In its bullet list, replace the "After sync:" bullet with:

```markdown
- After sync: open `<WEB_URL>/admin/navrhy/<slug>` → approve concepts + images (bulk-approve
  button for fresh syncs), pick one palette per concept, optionally edit concept texts inline
  (edits survive re-syncs) → set a password (min 8 chars) → **Finalize**. Give the client
  `<WEB_URL>/<locale>/navrh/<slug>` + the password.
```

Also delete the sentence "the website preserves any approval state / password set in its admin across re-syncs" only if it duplicates — actually KEEP that bullet (still true), just remove any reference to `approvals.json` being carried on first sync (the local review gate that produced it is gone). Also delete the legacy static-deploy blockquote (`> Legacy static-deploy path …`) — it depended on the removed local flow.

- [ ] **Step 5: Replace "Canva assembly (MCP)" section**

Replace the whole `## Canva assembly (MCP)` section with:

```markdown
## Canva (pose sketches only)

Canva MCP is used solely to **generate pose sketches** (Phase 5) — the deck/board assembly
path is retired; the website proposal is the deliverable.

- `generate-design` with the locked style spec from `references/pose-sketch-style.md` →
  `export-design` PNG → `library-add.mjs --kind pose --file <png> --emotion … --shot …`.
- Optionally group generated assets under a client folder (`create-folder`, parent `root`).
- Canva unavailable → local model / `GEMINI_API_KEY` fallbacks per Resilience below.
```

- [ ] **Step 6: Resilience section cleanup**

In `## Resilience`, delete the line `Canva MCP unavailable → deliver local HTML boards + markdown; note the gap.` and keep the pose-generation fallback lines. Verify no remaining references to Phase 6/7/8, `review-server`, `build-page`, `build-share`, `codes.mjs`, `presentation.pdf`, or `canva-links.md` outside historical context:

```bash
grep -n "Phase [6789]\|review-server\|build-page\|build-share\|presentation.pdf\|canva-links\|photo_collage\|merge-designs\|brand kit" .claude/skills/brand-shoot-prep/SKILL.md
```

Expected: no hits (or only the renamed `## Phase 6 — Publish` heading). The helper scripts stay on disk — they're just out of the workflow.

- [ ] **Step 7: Commit**

```bash
git add .claude/skills/brand-shoot-prep/SKILL.md
git commit -m "refactor(brand-shoot-prep): drop Canva deck + local review gate, web admin is the approval point

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Final verification + memory

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all previously passing tests still pass + new tests (rate-limit: 3, proposals: 7); only the 4 pre-existing jsdom/IntersectionObserver failures remain.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: build succeeds. (If routes 404 in dev afterwards, remember: stale `.next` → delete it — known gotcha.)

- [ ] **Step 3: Manual smoke (if a proposal exists in local KV)**

`npm run dev`, then:
- `/cs/navrh/<slug>` — gate shows "Návrh focení" label + associated label element; wrong password 6× → "Příliš mnoho pokusů…" message.
- After login: close section shows concept pills + message form; submit → success message; entry visible at `/admin/navrhy/<slug>` under "Reakce klienta"; list shows 💬 badge + "klient otevřel …".
- Admin: "Schválit vše (n)" buttons work; "Upravit texty" edits persist; password shorter than 8 rejected.

- [ ] **Step 4: Update memory**

Update `~/.claude/projects/-Users-tomasjarkovsky-Documents-Claude-Projects-guth-pictures/memory/project_brand_shoot_module.md`: Canva deck + local review gate dropped from skill (web admin = sole approval point); new features: client feedback (KV `feedback[]` + Formspree notify), open/review tracking, bulk approve, inline concept text edit (`edited` flag survives re-sync), min password 8 + rate limit on proposal auth.

- [ ] **Step 5: Final commit if anything uncommitted**

```bash
git status --short
```

Expected: clean (each task committed separately).

---

## Self-review notes

- **Spec coverage:** review items 1→Task 1+2, 2→Task 3 (+mail subject used in Task 5), 3→Task 4+5, 4→Task 6, 5→Task 9, 6→Task 4+7, 7→Task 4+8, 8+Canva-drop→Task 10. ✓
- **Type consistency:** `ConceptTextFields` defined in Task 4, consumed in Task 8 route; `EditableField` local to AdminProposalReview file; `ProposalFeedback` on record flows into `SafeProposal` automatically (it's `Omit<ProposalRecord, "passwordHash">`). `markOpened`/`markReviewed`/`addFeedback`/`editConcept` exported in Task 4, imported in Tasks 5/7/8. ✓
- **Known judgment calls:** heroes lazy-loaded (all below 100vh opening); `markReviewed` on page load clears the badge by design; Formspree notify is fire-and-forget and silently skipped without `NEXT_PUBLIC_FORMSPREE_FORM_ID`; admin-login route intentionally untouched; skill helper scripts (review-server, build-page…) stay on disk, only removed from the documented flow.
- **CSS var caveat:** `.bsp-fb-pill.is-active` text color + `.bsp-gate label` display are flagged in-step for verification against the real `globals.css` vars.
