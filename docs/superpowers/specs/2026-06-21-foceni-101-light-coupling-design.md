# Focení 101 — teaching the exposure triangle (light coupling)

**Date:** 2026-06-21
**Module:** `modules/foceni-101`

## Problem

The academy teaches each camera parameter in isolation. Right now the 3D scene
actively *hides* the most important truth: aperture, shutter, and ISO all control
the same thing — how much light reaches the sensor. Today brightness is only
`1.05 * exposure * isoGain` (`StudioScene.tsx:302-304`); opening the aperture only
blurs, a slow shutter only adds a ghost-trail. The user never learns that these
knobs trade against each other.

Goal: keep the clean single-concept teaching, then reveal the interconnection,
then make the user feel the trade-off through a hands-on challenge.

## Pedagogical order (non-negotiable)

Show each parameter **individually first**, then their interconnectivity.

```
00 intro
01 expozice   — brightness alone
02 clona      — blur alone        ┐
03 čas        — trail alone       ├ isolated; brightness HELD correct; no meter
04 ISO        — grain alone       ┘
05 ohnisko · 06 úhel · 07 WB · 08 kompozice   (unchanged)
──────────────────────────────────────────────────────────
09 "Všechno je světlo"  — REVEAL: meter appears; move clona → bar swings.
                          Copy names that čas + ISO push the same bar.
10 Capstone fix-it       — aperture locked open; balance with shutter + ISO.
→  CTA (unchanged)
```

## Architecture

### 1. Unified light model — `light.ts` (new, pure, single source of truth)

```
computeLight(params) → { mul, evDelta }
  apertureMul = (F_REF / f) ^ K_AP          // open clona (low f) → >1, brighter
  shutterMul  = (shutter + S0) / (SHUTTER_REF + S0)   // longer → >1
  isoGain     = 1 + log2(max(iso,100)/100) * ISO_K    // existing curve, moved here
  mul         = exposure * apertureMul * shutterMul * isoGain   // 1.0 = correctly exposed
  evDelta     = log2(mul)                    // 0 = correct, + = přepal, − = tma
```

Calibration constants at top of file, with `// ponytail:` comments — real f/1.4 is
+4 EV and blows fully white, so `K_AP` softens it to "dramatic but readable":

```
F_REF = 5.6          // ponytail: reference f-stop where apertureMul = 1
K_AP = 1.2           // ponytail: <2 softens the real (5.6/f)^2 so f/1.4 doesn't pure-white; tune visually
SHUTTER_REF = 0.15   // ponytail: the "fast/sharp" baseline from the čas section
S0 = 0.15            // ponytail: offset so shutter=0 isn't zero light
ISO_K = 0.12         // existing isoGain slope, unchanged
```

Both `StudioScene` and `ExposureMeter` consume this — one honest physics, no drift
between what's drawn and what the meter reads.

### 2. StudioScene brightness — replace coupling (`StudioScene.tsx`)

Replace lines 302-304 (`isoGain` + `toneMappingExposure`) with:

```
const { mul } = computeLight(current);
renderer.toneMappingExposure = 1.05 * mul;   // 1.05 = calibrated "correct"
```

`mul = 1` reproduces today's correct exposure. Everything else in the loop (bokeh,
grain, ghost-trail, FOV, tint) is unchanged. The ISO grain math (`gu.amount`) stays;
only the ISO *brightness* term folds into `computeLight`.

### 3. Holding brightness in isolated sections (auto-exposure)

Sections 02–04 must show **only** their own effect. The scene always runs coupled
physics, so the App cancels the side-effect by driving `exposure`:

```
// Foceni101App target memo, when section.holdLight:
const others = apertureMul * shutterMul * isoGain   // from computeLight internals
base.exposure = 1 / others                          // net mul stays 1 → correct, meter centered
```

This is literally how a camera's auto-exposure compensates — physically honest, and
it keeps the single-concept lesson clean. `light.ts` exposes the pieces needed
(either return the sub-multipliers or a helper `holdExposureFor(params)`).

`expozice` (01) does **not** hold — it's the section about brightness, exposure stays
free to go dark/bright.

### 4. Exposure meter — `ExposureMeter.tsx` (new)

The light bar from the mockup: `[█████░░░░░] +1.3 EV  přepal`, center mark = correct.
Reads `computeLight(target).evDelta` (target-driven, no per-frame callback plumbing
from the scene). Rendered as an overlay on `.f101-stage`. Visible only when the
active section has `meter: true` (09 reveal + 10 capstone); fades out otherwise via
CSS opacity transition. Word label reuses the tma / akorát / přepal vocabulary,
driven by `evDelta` thresholds.

### 5. Section config — `types.ts` + `sections.ts`

`types.ts`: add two optional flags to `Section`:
```
meter?: boolean;      // show the exposure meter while this section is active
holdLight?: boolean;  // auto-balance exposure so only the taught effect shows
```

`sections.ts`:
- `clona`, `cas`, `iso` → `holdLight: true`. Copy stays single-concept (no light
  mention — that lesson belongs to section 09).
- New section `09 "Všechno je světlo"` → `meter: true`, aperture slider, copy:
  "Clona, čas i ISO — všechny tři tajně hýbou stejnou věcí: světlem. Otevři clonu
  a koukni na ukazatel." (final copy tuned during implementation).

### 6. Capstone — `Capstone.tsx` (new, bespoke)

Not a generalized N-control system — only this one section needs multiple sliders
(YAGNI). Rendered as the section before the CTA. Behavior:

- Aperture **locked at f/1.4** (blur preserved); scene starts overexposed.
- Two sliders: shutter + ISO. Live meter (`meter: true`).
- Drives the scene `target` while it's the active section (lifts its slider state up,
  or owns target via the same mechanism as other sections).
- Success: `|evDelta| < EV_OK` (e.g. 0.3) → reveal payoff line:
  "Vyměnil jsi jedno za druhé. To je celý ten trojúhelník." Success is a soft state
  (no hard lock); the CTA follows regardless.

### 7. Styles — `app/globals.css`

`.f101-meter` (bar track, fill, center tick, EV label, fade transition) and capstone
layout (two stacked controls + goal text), all `f101-` prefixed, consuming existing
`--color-*` vars. Mobile: meter shrinks, stays in a scene corner.

### 8. Docs — `MODULE.md`

Document the unified light model, the holdLight auto-exposure mechanism, the meter,
and sections 09–10. Update the section table and the Stav/TODO list.

## Data flow

```
target params ──► computeLight() ──► mul ──► toneMappingExposure (StudioScene)
                              └──► evDelta ──► ExposureMeter (overlay)
holdLight section ──► base.exposure = 1/others ──► net mul = 1 (correct, no meter)
capstone ──► aperture pinned f/1.4, shutter+ISO from sliders ──► meter ──► success when |evDelta|<EV_OK
```

## Testing

`light.ts` ships one assert-based self-check (`demo()` / `__main__`-style, no framework):
- `computeLight(DEFAULT_PARAMS).evDelta ≈ 0` (default is correctly exposed)
- f/1.4 brighter than f/5.6 (`mul` higher)
- longer shutter brighter than short
- iso 6400 brighter than iso 100
- `holdExposureFor()` returns `mul ≈ 1` for any aperture/shutter/iso combo

Existing vitest baseline (~160 pass / 4 pre-existing jsdom fails) must not regress.

## Files

| File | Action |
|---|---|
| `modules/foceni-101/components/light.ts` | NEW — model + self-check |
| `modules/foceni-101/components/ExposureMeter.tsx` | NEW — light bar overlay |
| `modules/foceni-101/components/Capstone.tsx` | NEW — fix-it challenge |
| `modules/foceni-101/components/StudioScene.tsx` | EDIT — brightness via computeLight |
| `modules/foceni-101/components/sections.ts` | EDIT — flags + section 09 |
| `modules/foceni-101/components/types.ts` | EDIT — `meter?`, `holdLight?` |
| `modules/foceni-101/components/Foceni101App.tsx` | EDIT — meter overlay, holdLight, capstone |
| `app/globals.css` | EDIT — `.f101-meter`, capstone styles |
| `modules/foceni-101/MODULE.md` | EDIT — document light model + sections |

## Explicitly skipped (YAGNI)

- Generalizing `Section` to N controls — only the capstone is multi-slider; it's bespoke.
- Per-frame meter sync from the scene — target-driven pure function is enough.
- Three-slider reveal in section 09 — one slider + copy leads in; capstone proves it.
- Real EV accuracy — calibration constants favor readable drama over photographic exactness.
