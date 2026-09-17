# Focení 101 — Light Coupling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach the exposure triangle — show camera params individually, then reveal that aperture/shutter/ISO all control the same light, then make the user balance them.

**Architecture:** One pure light model (`light.ts`) becomes the single source of truth for scene brightness and an on-scene exposure meter. Isolated sections (02–04) auto-balance exposure so only their own effect shows; a reveal section (09) and a fix-it capstone (10) drop the balance so the coupling becomes visible and hands-on.

**Tech Stack:** Next.js (App Router), React, raw Three.js + EffectComposer, vitest. CSS in `app/globals.css` with `f101-` prefix.

---

## File Structure

| File | Responsibility |
|---|---|
| `modules/foceni-101/components/light.ts` | NEW — pure light model: `computeLight`, `apertureMul`, `holdExposureFor` |
| `modules/foceni-101/__tests__/light.test.ts` | NEW — vitest for the light model |
| `modules/foceni-101/components/StudioScene.tsx` | EDIT — brightness from `computeLight` |
| `modules/foceni-101/components/types.ts` | EDIT — `meter?`, `holdLight?`, `capstone?` flags |
| `modules/foceni-101/components/sections.ts` | EDIT — `holdLight` flags + sections 09 & 10 |
| `modules/foceni-101/components/ExposureMeter.tsx` | NEW — on-scene light bar |
| `modules/foceni-101/components/Capstone.tsx` | NEW — fix-it card with two sliders |
| `modules/foceni-101/components/Foceni101App.tsx` | EDIT — holdLight, meter overlay, capstone wiring |
| `app/globals.css` | EDIT — `.f101-meter`, `.f101-capstone-win` styles |
| `modules/foceni-101/MODULE.md` | EDIT — document light model + sections 09/10 |

---

## Task 1: Light model + tests

**Files:**
- Create: `modules/foceni-101/components/light.ts`
- Test: `modules/foceni-101/__tests__/light.test.ts`

- [ ] **Step 1: Write the failing test**

Create `modules/foceni-101/__tests__/light.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeLight, apertureMul, holdExposureFor } from "../components/light";
import { DEFAULT_PARAMS, type PhotoParams } from "../components/types";

const P = (over: Partial<PhotoParams> = {}): PhotoParams => ({ ...DEFAULT_PARAMS, ...over });

describe("computeLight", () => {
  it("default params are correctly exposed (evDelta ≈ 0)", () => {
    expect(computeLight(DEFAULT_PARAMS).evDelta).toBeCloseTo(0, 6);
  });

  it("wider aperture (lower f) is brighter", () => {
    expect(computeLight(P({ aperture: 1.4 })).mul).toBeGreaterThan(
      computeLight(P({ aperture: 5.6 })).mul,
    );
  });

  it("longer shutter is brighter", () => {
    expect(computeLight(P({ shutter: 0.8 })).mul).toBeGreaterThan(
      computeLight(P({ shutter: 0 })).mul,
    );
  });

  it("higher ISO is brighter", () => {
    expect(computeLight(P({ iso: 6400 })).mul).toBeGreaterThan(
      computeLight(P({ iso: 100 })).mul,
    );
  });

  it("apertureMul = 1 at the reference f-stop", () => {
    expect(apertureMul(5.6)).toBeCloseTo(1, 6);
  });
});

describe("holdExposureFor", () => {
  it("cancels aperture/shutter/ISO so net light stays correct", () => {
    const base = P({ aperture: 1.4, shutter: 0.5, iso: 1600 });
    base.exposure = holdExposureFor(base);
    expect(computeLight(base).mul).toBeCloseTo(1, 6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run modules/foceni-101/__tests__/light.test.ts`
Expected: FAIL — `Failed to resolve import "../components/light"`.

- [ ] **Step 3: Write minimal implementation**

Create `modules/foceni-101/components/light.ts`:

```ts
import type { PhotoParams } from "./types";

// ── Calibration knobs (favor readable drama over photographic exactness) ──────
const F_REF = 5.6;        // ponytail: reference f-stop where apertureMul = 1
const K_AP = 1.2;         // ponytail: <2 softens real (5.6/f)^2 so f/1.4 isn't pure white; tune visually
const SHUTTER_REF = 0;    // ponytail: default shutter (fast/sharp) = neutral baseline
const S0 = 0.5;           // ponytail: offset so the shutter curve is gentle, not a cliff
const ISO_K = 0.12;       // ISO brightness slope (moved out of StudioScene)

export interface Light {
  /** Total light multiplier. 1.0 = correctly exposed. */
  mul: number;
  /** Stops from correct. 0 = correct, + = přepal (over), − = tma (under). */
  evDelta: number;
}

/** Light gain from aperture. Open clona (low f) → > 1 (brighter). */
export function apertureMul(aperture: number): number {
  return Math.pow(F_REF / aperture, K_AP);
}

/** Light gain from shutter "slowness" (0 fast .. 1 slow). Longer → > 1. */
export function shutterMul(shutter: number): number {
  return (shutter + S0) / (SHUTTER_REF + S0);
}

/** Brightness gain from ISO. Higher → > 1 (also adds grain elsewhere). */
export function isoGain(iso: number): number {
  return 1 + Math.log2(Math.max(iso, 100) / 100) * ISO_K;
}

export function computeLight(p: PhotoParams): Light {
  const mul = p.exposure * apertureMul(p.aperture) * shutterMul(p.shutter) * isoGain(p.iso);
  return { mul, evDelta: Math.log2(mul) };
}

/**
 * Exposure value that cancels the aperture/shutter/ISO contributions, so net
 * light stays correct (= auto-exposure). Used by isolated sections that must
 * show only their own effect with no brightness change.
 */
export function holdExposureFor(p: PhotoParams): number {
  return 1 / (apertureMul(p.aperture) * shutterMul(p.shutter) * isoGain(p.iso));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run modules/foceni-101/__tests__/light.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add modules/foceni-101/components/light.ts modules/foceni-101/__tests__/light.test.ts
git commit -m "feat(foceni-101): unified light model + tests"
```

---

## Task 2: Wire StudioScene brightness to the light model

**Files:**
- Modify: `modules/foceni-101/components/StudioScene.tsx:302-304`

- [ ] **Step 1: Add the import**

At the top of `StudioScene.tsx`, alongside the existing `./types` import (line 11), add:

```ts
import { computeLight } from "./light";
```

- [ ] **Step 2: Replace the brightness calc**

Replace lines 302-304:

```ts
      // Exposure (+ slight ISO brightening)
      const isoGain = 1 + Math.log2(Math.max(current.iso, 100) / 100) * 0.12;
      renderer.toneMappingExposure = 1.05 * current.exposure * isoGain;
```

with:

```ts
      // Exposure: unified light model — aperture + shutter + ISO all feed brightness.
      renderer.toneMappingExposure = 1.05 * computeLight(current).mul;
```

(The grain `amount` math at ~line 339 is untouched; only the ISO *brightness* term moved into `computeLight`.)

- [ ] **Step 3: Verify build/typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors in `StudioScene.tsx` (no unused `isoGain` local remains).

- [ ] **Step 4: Commit**

```bash
git add modules/foceni-101/components/StudioScene.tsx
git commit -m "feat(foceni-101): scene brightness from unified light model"
```

---

## Task 3: Section flags + reveal/capstone config

**Files:**
- Modify: `modules/foceni-101/components/types.ts:47-58`
- Modify: `modules/foceni-101/components/sections.ts`

- [ ] **Step 1: Add flags to the Section type**

In `types.ts`, inside `interface Section` (after the `control?` field, ~line 57), add:

```ts
  /** Show the on-scene exposure meter while this section is active. */
  meter?: boolean;
  /** Auto-balance exposure so only this section's own effect shows (no brightness change). */
  holdLight?: boolean;
  /** Render the bespoke two-slider capstone card instead of a standard card. */
  capstone?: boolean;
```

- [ ] **Step 2: Mark the isolated light sections**

In `sections.ts`, add `holdLight: true` to the `clona`, `cas`, and `iso` sections. For each, add the line directly after its `target: {...},`. Example for `clona`:

```ts
    target: { aperture: 1.4 },
    holdLight: true,
```

Apply the identical `holdLight: true,` addition to `cas` (after `target: { shutter: 0 },`) and `iso` (after `target: { iso: 100 },`). Do NOT add it to `expozice` — that section is about brightness and must stay free.

- [ ] **Step 3: Add the reveal + capstone sections**

In `sections.ts`, insert these two entries at the end of the `SECTIONS` array, after the `kompozice` section (before the closing `];`):

```ts
  {
    id: "svetlo",
    num: "09",
    title: "Všechno je světlo",
    body:
      "Tady je ten trik, co spojuje předchozí tři. Clona, čas i ISO — každý z nich potají přidává nebo ubírá světlo. Otevři clonu a koukni na ukazatel: fotka začne přepalovat. Čas a ISO dělají úplně to samé.",
    target: { aperture: 5.6 },
    meter: true,
    control: {
      param: "aperture",
      min: 1.4,
      max: 16,
      step: 0.1,
      label: "Clona",
      fmt: (v) => `f/${v.toFixed(1)}`,
      invert: true,
    },
  },
  {
    id: "capstone",
    num: "10",
    title: "Zkus to vybalancovat",
    body:
      "Chceš rozmazané pozadí, tak držíš clonu dokořán (f/1.4). Jenže tím pustíš dovnitř spoustu světla — fotka je přepálená. Sjeď čas a ISO dolů, dokud ukazatel nesedne na střed. Můžeš to dohnat víc časem, nebo víc ISO — to je ten obchod.",
    target: { aperture: 1.4 },
    meter: true,
    capstone: true,
  },
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add modules/foceni-101/components/types.ts modules/foceni-101/components/sections.ts
git commit -m "feat(foceni-101): section flags + reveal & capstone config"
```

---

## Task 4: Auto-balance exposure for isolated sections

**Files:**
- Modify: `modules/foceni-101/components/Foceni101App.tsx:55-60`

- [ ] **Step 1: Add the import**

In `Foceni101App.tsx`, update the light/types imports (line 6 area) — add:

```ts
import { holdExposureFor } from "./light";
```

- [ ] **Step 2: Apply holdLight in the target memo**

Replace the `target` memo (lines 55-60):

```ts
  const target = useMemo<PhotoParams>(() => {
    const sec = SECTIONS[activeIndex];
    const base: PhotoParams = { ...DEFAULT_PARAMS, ...sec.target };
    if (sec.control) base[sec.control.param] = sliderVals[sec.id];
    return base;
  }, [activeIndex, sliderVals]);
```

with:

```ts
  const target = useMemo<PhotoParams>(() => {
    const sec = SECTIONS[activeIndex];
    const base: PhotoParams = { ...DEFAULT_PARAMS, ...sec.target };
    if (sec.control) base[sec.control.param] = sliderVals[sec.id];
    // Isolated sections: cancel the side-effect on brightness so only the
    // taught effect (blur / trail / grain) shows. Reveal & capstone skip this.
    if (sec.holdLight) base.exposure = holdExposureFor(base);
    return base;
  }, [activeIndex, sliderVals]);
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/cs/foceni-101`. Scroll to **02 clona**, drag the slider open: background blurs but overall brightness stays steady (no přepal). Scroll to **09**, drag clona open: image visibly brightens. Confirm the difference.

- [ ] **Step 4: Commit**

```bash
git add modules/foceni-101/components/Foceni101App.tsx
git commit -m "feat(foceni-101): hold exposure in isolated sections"
```

---

## Task 5: Exposure meter overlay

**Files:**
- Create: `modules/foceni-101/components/ExposureMeter.tsx`
- Modify: `modules/foceni-101/components/Foceni101App.tsx` (stage overlay)
- Modify: `app/globals.css` (after the `.f101-dot--on` block, ~line 1101)

- [ ] **Step 1: Create the meter component**

Create `modules/foceni-101/components/ExposureMeter.tsx`:

```tsx
"use client";

import { computeLight } from "./light";
import type { PhotoParams } from "./types";

const RANGE = 3; // EV shown on each side of correct

export function ExposureMeter({ params, show }: { params: PhotoParams; show: boolean }) {
  const { evDelta } = computeLight(params);
  const clamped = Math.max(-RANGE, Math.min(RANGE, evDelta));
  const pct = ((clamped + RANGE) / (2 * RANGE)) * 100; // 0..100, 50 = correct
  const word = evDelta > 0.4 ? "přepal" : evDelta < -0.4 ? "tma" : "akorát";
  return (
    <div className={`f101-meter${show ? " f101-meter--on" : ""}`} aria-hidden>
      <div className="f101-meter-track">
        <span className="f101-meter-fill" style={{ width: `${pct}%` }} />
        <span className="f101-meter-tick" />
      </div>
      <div className="f101-meter-label">
        {evDelta >= 0 ? "+" : ""}{evDelta.toFixed(1)} EV · {word}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Render it on the stage**

In `Foceni101App.tsx`, add the import near the other component imports:

```ts
import { ExposureMeter } from "./ExposureMeter";
```

Inside `.f101-stage`, right after `<StudioScene ... />` (line 65), add:

```tsx
        <ExposureMeter params={target} show={!!SECTIONS[activeIndex]?.meter} />
```

- [ ] **Step 3: Add styles**

In `app/globals.css`, after the `.f101-dot--on { ... }` block (~line 1101), add:

```css
.f101-meter {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  width: min(260px, 60vw);
  text-align: center;
  opacity: 0;
  transition: opacity 350ms;
  pointer-events: none;
}
.f101-meter--on { opacity: 1; }
.f101-meter-track {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: var(--color-bg-overlay);
  border: 1px solid var(--color-border);
  overflow: hidden;
}
.f101-meter-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--color-accent);
  transition: width 200ms;
}
.f101-meter-tick {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--color-text);
  z-index: 1;
}
.f101-meter-label {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: var(--tracking-wider);
  color: var(--color-text-muted);
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `/cs/foceni-101`. Meter is hidden in sections 00–08, fades in at **09**. Drag clona open → fill grows past center, label shows `+x.x EV · přepal`.

- [ ] **Step 5: Commit**

```bash
git add modules/foceni-101/components/ExposureMeter.tsx modules/foceni-101/components/Foceni101App.tsx app/globals.css
git commit -m "feat(foceni-101): on-scene exposure meter"
```

---

## Task 6: Capstone fix-it card

**Files:**
- Create: `modules/foceni-101/components/Capstone.tsx`
- Modify: `modules/foceni-101/components/Foceni101App.tsx` (state, target memo, render branch)
- Modify: `app/globals.css` (`.f101-capstone-win`)

- [ ] **Step 1: Create the capstone component**

Create `modules/foceni-101/components/Capstone.tsx`:

```tsx
"use client";

export interface CapVals {
  shutter: number;
  iso: number;
}

interface Props {
  num: string;
  title: string;
  body: string;
  vals: CapVals;
  onChange: (v: CapVals) => void;
  solved: boolean;
  active: boolean;
}

const SLIDERS = [
  { key: "shutter" as const, min: 0, max: 1, step: 0.01, label: "Čas závěrky",
    fmt: (v: number) => (v < 0.15 ? "rychlý" : v > 0.6 ? "dlouhý" : "střední") },
  { key: "iso" as const, min: 100, max: 6400, step: 100, label: "ISO",
    fmt: (v: number) => `${Math.round(v)}` },
];

export function Capstone({ num, title, body, vals, onChange, solved, active }: Props) {
  return (
    <div className={`f101-card${active ? " f101-card--active" : ""}`}>
      <div className="f101-card-num">{num}</div>
      <h2 className="f101-card-title">{title}</h2>
      <p className="f101-card-body">{body}</p>

      {SLIDERS.map((c) => {
        const val = vals[c.key];
        const pct = ((val - c.min) / (c.max - c.min)) * 100;
        return (
          <div className="f101-ctrl" key={c.key}>
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
              onChange={(e) => onChange({ ...vals, [c.key]: parseFloat(e.target.value) })}
            />
          </div>
        );
      })}

      <p className={`f101-capstone-win${solved ? " f101-capstone-win--on" : ""}`}>
        Vyměnil jsi jedno za druhé. To je celý ten trojúhelník.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Wire capstone state + target into the App**

In `Foceni101App.tsx`:

(a) Update the light import to also bring in `apertureMul` and `computeLight`:

```ts
import { holdExposureFor, apertureMul, computeLight } from "./light";
```

(b) Add the Capstone import and type:

```ts
import { Capstone, type CapVals } from "./Capstone";
```

(c) Add capstone slider state next to the other `useState` hooks (~line 23):

```ts
  const [capVals, setCapVals] = useState<CapVals>({ shutter: 0.5, iso: 1600 });
```

(d) Extend the `target` memo to handle the capstone. Replace the memo body from Task 4 with:

```ts
  const target = useMemo<PhotoParams>(() => {
    const sec = SECTIONS[activeIndex];
    const base: PhotoParams = { ...DEFAULT_PARAMS, ...sec.target };
    if (sec.capstone) {
      // Aperture locked open (blur kept). Exposure pinned so that min shutter +
      // min ISO would be correct — the user must cancel the extra light they're
      // given. Many shutter/ISO combos solve it: that's the trade-off.
      base.aperture = 1.4;
      base.shutter = capVals.shutter;
      base.iso = capVals.iso;
      base.exposure = 1 / apertureMul(1.4);
      return base;
    }
    if (sec.control) base[sec.control.param] = sliderVals[sec.id];
    if (sec.holdLight) base.exposure = holdExposureFor(base);
    return base;
  }, [activeIndex, sliderVals, capVals]);
```

(e) Compute the solved flag below the memo:

```ts
  const capSolved =
    !!SECTIONS[activeIndex]?.capstone && Math.abs(computeLight(target).evDelta) < 0.3;
```

- [ ] **Step 3: Render the capstone card in the section map**

In `Foceni101App.tsx`, inside `SECTIONS.map(...)`, replace the standard card markup with a branch. Change the `<section>` body so the card is chosen by `s.capstone`:

```tsx
            <section
              key={s.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className="f101-section"
            >
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
            </section>
```

(Note: `const c = s.control; const val = ...; const pct = ...;` at the top of the map callback stay as-is; for the capstone row they're simply unused.)

- [ ] **Step 4: Add the win style**

In `app/globals.css`, after the `.f101-ctrl` related blocks (anywhere in the f101 group), add:

```css
.f101-capstone-win {
  margin: 16px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-accent);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 350ms, transform 350ms;
}
.f101-capstone-win--on {
  opacity: 1;
  transform: none;
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `/cs/foceni-101`, scroll to **10**. Scene shows blurred background and is overexposed; meter reads positive `EV · přepal`. Drag shutter toward `rychlý` and ISO toward `100` → meter centers, `· akorát`, and the win line fades in. Confirm a different mix (more shutter, less ISO) also solves it.

- [ ] **Step 6: Commit**

```bash
git add modules/foceni-101/components/Capstone.tsx modules/foceni-101/components/Foceni101App.tsx app/globals.css
git commit -m "feat(foceni-101): fix-it capstone section"
```

---

## Task 7: Update MODULE.md

**Files:**
- Modify: `modules/foceni-101/MODULE.md`

- [ ] **Step 1: Document the light model and new sections**

In `MODULE.md`: (a) add a row note that aperture/shutter/ISO now feed a unified light model (`light.ts`); (b) extend the section list to include `09 Všechno je světlo` (reveal) and `10 capstone` (fix-it balancing); (c) note `holdLight` auto-exposure for isolated sections and the `ExposureMeter`; (d) in the Struktura block add `light.ts`, `ExposureMeter.tsx`, `Capstone.tsx`; (e) update the Stav/TODO list (CTA→Formspree and i18n still open; light coupling now done).

- [ ] **Step 2: Commit**

```bash
git add modules/foceni-101/MODULE.md
git commit -m "docs(foceni-101): document light model + sections 09/10"
```

---

## Task 8: Full regression check

- [ ] **Step 1: Run the whole suite**

Run: `npm test`
Expected: light.test.ts passes; baseline unchanged (~160 pass / 4 pre-existing jsdom fails). No new failures.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean.

---

## Self-Review notes

- **Spec coverage:** light model (T1), scene coupling (T2), isolated-section hold (T3/T4), reveal section 09 (T3), exposure meter (T5), capstone fix-it (T6), docs (T7), tests/regression (T1/T8). All spec sections mapped.
- **Capstone solvability:** aperture pinned f/1.4 with `exposure = 1/apertureMul(1.4)` makes min shutter + min ISO read 0 EV; initial `{shutter:0.5, iso:1600}` starts overexposed → user reduces. Multiple solutions exist (the intended trade-off lesson).
- **Type consistency:** `computeLight`, `apertureMul`, `holdExposureFor`, `isoGain`, `shutterMul` (light.ts); `CapVals {shutter, iso}` shared App↔Capstone; flags `meter`/`holdLight`/`capstone` on `Section`.
