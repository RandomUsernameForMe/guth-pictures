# Focení 101 — Composition Section Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-slider composition section with a chip picker over five named compositions (thirds, centre, golden, leading lines, negative space), each with its own explanation and a stage overlay; leading/golden guides aim at the subject and appear on hover.

**Architecture:** A `compositions.ts` config drives a bespoke `CompositionPicker` card (like the existing `Capstone`) and a `CompositionOverlay` SVG drawn over the sticky stage (like `ExposureMeter`). Selecting/hovering a chip sets the scene's `composition` (subject X) and a new `framing` (camera dolly) param.

**Tech Stack:** Next.js (App Router), React, raw Three.js, vitest, CSS in `app/globals.css` (`f101-` prefix).

---

## File Structure

| File | Responsibility |
|---|---|
| `modules/foceni-101/components/compositions.ts` | NEW — `COMPOSITIONS` config, `OverlayKind`, `subjectScreenX` |
| `modules/foceni-101/__tests__/compositions.test.ts` | NEW — config + mapping tests |
| `modules/foceni-101/components/CompositionOverlay.tsx` | NEW — SVG guide overlay |
| `modules/foceni-101/components/CompositionPicker.tsx` | NEW — chip card |
| `modules/foceni-101/components/types.ts` | EDIT — `PhotoParams.framing`, `Section.composition?` |
| `modules/foceni-101/components/StudioScene.tsx` | EDIT — lerp + apply `framing` to camera distance |
| `modules/foceni-101/components/sections.ts` | EDIT — section 08 → `composition: true` |
| `modules/foceni-101/components/Foceni101App.tsx` | EDIT — state, target branch, overlay, render branch, remove inline thirds |
| `app/globals.css` | EDIT — `.f101-chip*`, `.f101-comp-overlay*` |
| `modules/foceni-101/MODULE.md` | EDIT — document the rebuild |

---

## Task 1: Compositions config + tests

**Files:**
- Create: `modules/foceni-101/components/compositions.ts`
- Test: `modules/foceni-101/__tests__/compositions.test.ts`

- [ ] **Step 1: Write the failing test**

Create `modules/foceni-101/__tests__/compositions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { COMPOSITIONS, subjectScreenX, type OverlayKind } from "../components/compositions";

const KINDS: OverlayKind[] = ["thirds", "center", "golden", "leading", "space"];

describe("COMPOSITIONS", () => {
  it("comp in [-1,1] and framing >= 1", () => {
    for (const c of COMPOSITIONS) {
      expect(c.comp).toBeGreaterThanOrEqual(-1);
      expect(c.comp).toBeLessThanOrEqual(1);
      expect(c.framing).toBeGreaterThanOrEqual(1);
    }
  });
  it("each overlay is a known kind", () => {
    for (const c of COMPOSITIONS) expect(KINDS).toContain(c.overlay);
  });
  it("has the five expected compositions", () => {
    expect(COMPOSITIONS.map((c) => c.id)).toEqual([
      "thirds", "center", "golden", "leading", "space",
    ]);
  });
});

describe("subjectScreenX", () => {
  it("centre maps to ~0.5", () => expect(subjectScreenX(0)).toBeCloseTo(0.5, 6));
  it("positive comp moves right", () => expect(subjectScreenX(0.5)).toBeGreaterThan(0.5));
  it("clamps to [0,1]", () => {
    expect(subjectScreenX(-5)).toBe(0);
    expect(subjectScreenX(5)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/foceni-101/__tests__/compositions.test.ts`
Expected: FAIL — `Failed to resolve import "../components/compositions"`.

- [ ] **Step 3: Write minimal implementation**

Create `modules/foceni-101/components/compositions.ts`:

```ts
export type OverlayKind = "thirds" | "center" | "golden" | "leading" | "space";

export interface Composition {
  id: string;
  /** Chip text (CS). */
  label: string;
  /** Explanation of what differs (CS, exact, no metaphor). */
  body: string;
  /** Subject horizontal placement, -1..1 (maps to scene `composition`). */
  comp: number;
  /** Camera-distance multiplier (1 = normal, >1 = subject smaller). */
  framing: number;
  overlay: OverlayKind;
}

export const COMPOSITIONS: Composition[] = [
  {
    id: "thirds",
    label: "Třetiny",
    comp: 0.5,
    framing: 1,
    overlay: "thirds",
    body: "Subjekt leží na pravé třetinové čáře místo ve středu. Pohled má kam plynout a záběr působí vyváženě, ne staticky.",
  },
  {
    id: "center",
    label: "Na střed",
    comp: 0,
    framing: 1,
    overlay: "center",
    body: "Subjekt přesně uprostřed. Působí symetricky, formálně a přímo — vhodné, když chceš klid a konfrontaci pohledem.",
  },
  {
    id: "golden",
    label: "Zlatý řez",
    comp: 0.62,
    framing: 1,
    overlay: "golden",
    body: "Subjekt na linii zlatého řezu (≈ 62 %). Podobné třetinám, ale o kousek blíž středu — poměr převzatý z malířství.",
  },
  {
    id: "leading",
    label: "Vedoucí linie",
    comp: 0,
    framing: 1,
    overlay: "leading",
    body: "Linie v záběru (cesty, hrany, světlo) směřují k subjektu a vedou k němu oko diváka. Najeď myší na dlaždici a uvidíš je.",
  },
  {
    id: "space",
    label: "Prostor",
    comp: -0.55,
    framing: 1.8,
    overlay: "space",
    body: "Subjekt je malý a posunutý ke kraji, zbytek záběru zůstává prázdný. Negativní prostor dává záběru dýchat a podtrhuje měřítko.",
  },
];

/** Subject world X = comp * 0.7 in the scene; approximate to screen fraction 0..1. */
export function subjectScreenX(comp: number): number {
  return Math.min(1, Math.max(0, 0.5 + comp * 0.32));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run modules/foceni-101/__tests__/compositions.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/foceni-101/components/compositions.ts modules/foceni-101/__tests__/compositions.test.ts
git commit -m "feat(foceni-101): composition config + tests

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Scene `framing` param + Section flag

**Files:**
- Modify: `modules/foceni-101/components/types.ts`
- Modify: `modules/foceni-101/components/StudioScene.tsx`

- [ ] **Step 1: Add `framing` to PhotoParams + default**

In `types.ts`, inside `interface PhotoParams` (after the `composition` field), add:

```ts
  /** Camera-distance multiplier for framing. 1 = normal; >1 dollies back (subject smaller). */
  framing: number;
```

In the same file, in `DEFAULT_PARAMS`, add `framing: 1,` (e.g. after `composition: 0,`).

- [ ] **Step 2: Add the `composition` flag to Section**

In `types.ts`, inside `interface Section` (after the existing `capstone?` flag), add:

```ts
  /** Render the bespoke composition picker card instead of a standard card. */
  composition?: boolean;
```

- [ ] **Step 3: Lerp + apply framing in StudioScene**

In `StudioScene.tsx`, find the param lerp block (the run of `current.X = lerp(...)` lines). After the `current.composition = lerp(...)` line, add:

```ts
      current.framing = lerp(current.framing, t.framing, k);
```

Then find the camera distance line:

```ts
      const dist = BASE_DISTANCE * (current.focal / BASE_FOCAL);
```

and change it to:

```ts
      const dist = BASE_DISTANCE * (current.focal / BASE_FOCAL) * current.framing;
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (`DEFAULT_PARAMS` now satisfies `PhotoParams` including `framing`; `current` is built from `DEFAULT_PARAMS` so `current.framing` exists.)

- [ ] **Step 5: Commit**

```bash
git add modules/foceni-101/components/types.ts modules/foceni-101/components/StudioScene.tsx
git commit -m "feat(foceni-101): framing param dollies camera for composition

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Section config → composition picker

**Files:**
- Modify: `modules/foceni-101/components/sections.ts`

- [ ] **Step 1: Convert the kompozice section**

In `sections.ts`, replace the entire `kompozice` section object:

```ts
  {
    id: "kompozice",
    num: "08",
    title: "Kompozice",
    body:
      "Umístění subjektu v záběru. Pravidlo třetin radí položit subjekt na třetinovou čáru místo do středu — je to výchozí vodítko, ne zákon. Posuň hlavu a sleduj mřížku.",
    target: { composition: 0.5 },
    control: {
      param: "composition",
      min: -1,
      max: 1,
      step: 0.01,
      label: "Umístění",
      fmt: (v) => (v < -0.2 ? "levá třetina" : v > 0.2 ? "pravá třetina" : "střed"),
    },
  },
```

with:

```ts
  {
    id: "kompozice",
    num: "08",
    title: "Kompozice",
    body: "Kam v záběru subjekt patří. Vyber kompozici a porovnej, jak mění vyznění.",
    target: {},
    composition: true,
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add modules/foceni-101/components/sections.ts
git commit -m "feat(foceni-101): kompozice section uses composition picker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Composition overlay (SVG guides)

**Files:**
- Create: `modules/foceni-101/components/CompositionOverlay.tsx`
- Modify: `app/globals.css` (after the `.f101-meter-label` block)

- [ ] **Step 1: Create the overlay component**

Create `modules/foceni-101/components/CompositionOverlay.tsx`:

```tsx
"use client";

import type { OverlayKind } from "./compositions";

interface Props {
  kind: OverlayKind;
  /** Subject horizontal position as a 0..1 screen fraction (for leading/space). */
  subjectX: number;
  show: boolean;
}

export function CompositionOverlay({ kind, subjectX, show }: Props) {
  const sx = subjectX * 100;
  return (
    <svg
      className={`f101-comp-overlay${show ? " f101-comp-overlay--on" : ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {kind === "thirds" && (
        <>
          <line x1="33.33" y1="0" x2="33.33" y2="100" />
          <line x1="66.66" y1="0" x2="66.66" y2="100" />
          <line x1="0" y1="33.33" x2="100" y2="33.33" />
          <line x1="0" y1="66.66" x2="100" y2="66.66" />
        </>
      )}
      {kind === "center" && (
        <>
          <line x1="50" y1="0" x2="50" y2="100" />
          <line className="f101-comp-faint" x1="0" y1="50" x2="100" y2="50" />
        </>
      )}
      {kind === "golden" && (
        <>
          <line x1="38.2" y1="0" x2="38.2" y2="100" />
          <line x1="61.8" y1="0" x2="61.8" y2="100" />
          <line x1="0" y1="38.2" x2="100" y2="38.2" />
          <line x1="0" y1="61.8" x2="100" y2="61.8" />
        </>
      )}
      {kind === "leading" && (
        <>
          <line x1="0" y1="0" x2={sx} y2="55" />
          <line x1="100" y1="0" x2={sx} y2="55" />
          <line x1="0" y1="100" x2={sx} y2="55" />
          <line x1="100" y1="100" x2={sx} y2="55" />
        </>
      )}
      {kind === "space" && (
        <rect
          className="f101-comp-space"
          x={subjectX < 0.5 ? 50 : 0}
          y="0"
          width="50"
          height="100"
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Add overlay styles**

In `app/globals.css`, after the `.f101-meter-label { ... }` block, add:

```css
.f101-comp-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms;
}
.f101-comp-overlay--on { opacity: 1; }
.f101-comp-overlay line {
  stroke: color-mix(in srgb, var(--color-accent) 55%, transparent);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.f101-comp-overlay .f101-comp-faint {
  stroke: color-mix(in srgb, var(--color-accent) 22%, transparent);
}
.f101-comp-space {
  fill: color-mix(in srgb, var(--color-accent) 12%, transparent);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add modules/foceni-101/components/CompositionOverlay.tsx app/globals.css
git commit -m "feat(foceni-101): composition guide overlay (SVG)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Composition picker card

**Files:**
- Create: `modules/foceni-101/components/CompositionPicker.tsx`
- Modify: `app/globals.css` (after the overlay styles from Task 4)

- [ ] **Step 1: Create the picker component**

Create `modules/foceni-101/components/CompositionPicker.tsx`:

```tsx
"use client";

import { COMPOSITIONS } from "./compositions";

interface Props {
  num: string;
  title: string;
  selected: number;
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
  active: boolean;
}

export function CompositionPicker({ num, title, selected, onSelect, onHover, active }: Props) {
  const sel = COMPOSITIONS[selected];
  return (
    <div className={`f101-card${active ? " f101-card--active" : ""}`}>
      <div className="f101-card-num">{num}</div>
      <h2 className="f101-card-title">{title}</h2>
      <div className="f101-chips" onMouseLeave={() => onHover(null)}>
        {COMPOSITIONS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            className={`f101-chip${i === selected ? " f101-chip--on" : ""}`}
            onClick={() => onSelect(i)}
            onMouseEnter={() => onHover(i)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="f101-card-body">{sel.body}</p>
    </div>
  );
}
```

- [ ] **Step 2: Add chip styles**

In `app/globals.css`, after the `.f101-comp-space` block, add:

```css
.f101-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0;
}
.f101-chip {
  pointer-events: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 200ms, border-color 200ms, background 200ms;
}
.f101-chip:hover { color: var(--color-text); }
.f101-chip--on {
  color: var(--color-accent);
  border-color: color-mix(in srgb, var(--color-accent) 50%, transparent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add modules/foceni-101/components/CompositionPicker.tsx app/globals.css
git commit -m "feat(foceni-101): composition picker chip card

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Wire composition into Foceni101App

**Files:**
- Modify: `modules/foceni-101/components/Foceni101App.tsx`

- [ ] **Step 1: Add imports**

In `Foceni101App.tsx`, add near the other component/config imports:

```ts
import { CompositionPicker } from "./CompositionPicker";
import { CompositionOverlay } from "./CompositionOverlay";
import { COMPOSITIONS, subjectScreenX } from "./compositions";
```

- [ ] **Step 2: Add picker state**

Next to the other `useState` hooks (after `capVals`), add:

```ts
  const [compSel, setCompSel] = useState(0);
  const [compHover, setCompHover] = useState<number | null>(null);
```

- [ ] **Step 3: Add the composition branch to the target memo**

In the `target` useMemo, add this branch immediately after the `if (sec.capstone) { ... }` block and before `if (sec.control) ...`:

```ts
    if (sec.composition) {
      const cmp = COMPOSITIONS[compHover ?? compSel];
      base.composition = cmp.comp;
      base.framing = cmp.framing;
      return base;
    }
```

Update the memo dependency array to include the new state:

```ts
  }, [activeIndex, sliderVals, capVals, compSel, compHover]);
```

- [ ] **Step 4: Render the overlay on the stage**

Find the existing inline rule-of-thirds block and DELETE it entirely:

```tsx
        {SECTIONS[activeIndex]?.id === "kompozice" && (
          <div className="f101-thirds" aria-hidden>
            <span className="f101-thirds-v" style={{ left: "33.33%" }} />
            <span className="f101-thirds-v" style={{ left: "66.66%" }} />
            <span className="f101-thirds-h" style={{ top: "33.33%" }} />
            <span className="f101-thirds-h" style={{ top: "66.66%" }} />
          </div>
        )}
```

In its place (still inside `.f101-stage`, near the `<ExposureMeter ... />`), add:

```tsx
        <CompositionOverlay
          kind={COMPOSITIONS[compHover ?? compSel].overlay}
          subjectX={subjectScreenX(COMPOSITIONS[compHover ?? compSel].comp)}
          show={SECTIONS[activeIndex]?.composition === true}
        />
```

- [ ] **Step 5: Render the picker card in the section map**

In the `SECTIONS.map(...)` render, change the card-selection branch so composition sections render the picker. The current branch is `s.capstone ? <Capstone .../> : ( <div className="f101-card">...</div> )`. Make it:

```tsx
              {s.capstone ? (
                <Capstone
                  num={s.num}
                  title={s.title}
                  body={s.body}
                  vals={capVals}
                  onChange={setCapVals}
                  solved={capSolved}
                  active={i === activeIndex}
                />
              ) : s.composition ? (
                <CompositionPicker
                  num={s.num}
                  title={s.title}
                  selected={compSel}
                  onSelect={setCompSel}
                  onHover={setCompHover}
                  active={i === activeIndex}
                />
              ) : (
                <div className={`f101-card${i === activeIndex ? " f101-card--active" : ""}`}>
                  <div className="f101-card-num">{s.num}</div>
                  <h2 className="f101-card-title">{s.title}</h2>
                  <p className="f101-card-body">{s.body}</p>

                  {c && (
                    <div className="f101-ctrl">
                      <div className="f101-ctrl-row">
                        <span>{c.label}</span>
                        <span className="f101-ctrl-val">{c.fmt(val)}</span>
                      </div>
                      <input
                        type="range"
                        className="gp-slider"
                        min={c.min}
                        max={c.max}
                        step={c.step}
                        value={val}
                        style={{ ["--p" as string]: `${pct}%` }}
                        onChange={(e) =>
                          setSliderVals((v) => ({ ...v, [s.id]: parseFloat(e.target.value) }))
                        }
                      />
                    </div>
                  )}

                  {i === 0 && <div className="f101-scroll-hint">scrolluj ↓</div>}
                </div>
              )}
```

(Keep the `const c = s.control; const val = ...; const pct = ...;` map locals as-is — unused for composition sections, that's fine.)

- [ ] **Step 6: Typecheck + manual check**

Run: `npx tsc --noEmit`
Expected: no errors.

Then: `rm -rf .next && npm run dev`, open `/cs/foceni-101`, scroll to **08 Kompozice**. Click each chip → subject repositions, explanation swaps, the matching overlay shows. Hover "Vedoucí linie" → diagonal lines aim at the subject. Select "Prostor" → subject shrinks (camera dollies back) with empty space + shaded region. (Note the `rm -rf .next` — dev serves stale CSS otherwise.)

- [ ] **Step 7: Commit**

```bash
git add modules/foceni-101/components/Foceni101App.tsx
git commit -m "feat(foceni-101): wire composition picker + overlay

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Update MODULE.md

**Files:**
- Modify: `modules/foceni-101/MODULE.md`

- [ ] **Step 1: Document the composition rebuild**

In `MODULE.md`: (a) update the section-08 row to note it's now a chip picker over `COMPOSITIONS` with a guide overlay; (b) add `compositions.ts`, `CompositionPicker.tsx`, `CompositionOverlay.tsx` to the Struktura block; (c) note the new `framing` PhotoParams field (camera dolly) and the `composition` Section flag; (d) mention leading/golden overlays aim at `subjectScreenX(comp)`.

- [ ] **Step 2: Commit**

```bash
git add modules/foceni-101/MODULE.md
git commit -m "docs(foceni-101): document composition rebuild

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Regression + visual verification

- [ ] **Step 1: Full suite + typecheck + build**

Run: `npm test` — expect compositions.test.ts passing, baseline otherwise unchanged (~166 pass / 4 pre-existing jsdom fails).
Run: `npx tsc --noEmit && npm run build` — expect clean.

- [ ] **Step 2: Visual probe (headless chromium)**

With `npm run dev` running on a known port, drive a `playwright-core` script (chromium cached at `~/Library/Caches/ms-playwright`) to: scroll to section 08, click each chip, screenshot, and hover "Vedoucí linie". Confirm: overlay swaps per chip, leading lines aim at subject, "Prostor" shrinks subject. Fix any visual issue and re-verify before claiming done.

---

## Self-Review notes

- **Spec coverage:** config (T1), framing scene param (T2), section flag (T2/T3), overlay (T4), picker (T5), wiring + remove old thirds (T6), docs (T7), tests/visual (T1/T8). All spec sections mapped.
- **Type consistency:** `OverlayKind`, `Composition`, `COMPOSITIONS`, `subjectScreenX` (compositions.ts); `PhotoParams.framing`, `Section.composition?` (types.ts); picker props `selected/onSelect/onHover/active`; overlay props `kind/subjectX/show`. App uses `compSel`/`compHover` consistently in memo deps, overlay, and picker.
- **Hover preview:** target memo and overlay both read `COMPOSITIONS[compHover ?? compSel]`, so hovering a chip previews both the scene placement and the overlay; leaving the chip row (`onHover(null)`) reverts to the selected one.
