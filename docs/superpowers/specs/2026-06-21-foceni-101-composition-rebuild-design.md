# Focení 101 — Composition section rebuild

**Date:** 2026-06-21
**Module:** `modules/foceni-101`

## Problem

Section 08 (kompozice) teaches composition with a single slider that only slides the
subject left/right, plus a static rule-of-thirds grid. That can't show distinct,
named compositions or explain how each differs. We want a section that presents
several composition principles as clickable options, each with its own explanation
and its own visual guide (incl. leading lines on hover).

## Goal

Replace the single-slider composition section with a chip-based picker over five
named compositions. Selecting one snaps the scene to that composition and swaps the
explanation; each has a guide overlay (grid / axis / leading lines / golden grid /
negative-space highlight). Hovering a chip previews its overlay.

## Compositions (config)

New `modules/foceni-101/components/compositions.ts` exporting `COMPOSITIONS`:

```ts
export type OverlayKind = "thirds" | "center" | "golden" | "leading" | "space";

export interface Composition {
  id: string;
  label: string;        // chip text (CS)
  body: string;         // explanation of what differs (CS, exact, no metaphor)
  comp: number;         // subject X, -1..1 (maps to scene `composition` param)
  framing: number;      // camera-distance multiplier (1 = normal; >1 = subject smaller)
  overlay: OverlayKind;
}
```

| id | label | comp | framing | overlay |
|---|---|---|---|---|
| `thirds` | Třetiny | +0.5 | 1 | thirds |
| `center` | Na střed | 0 | 1 | center |
| `golden` | Zlatý řez | +0.62 | 1 | golden |
| `leading` | Vedoucí linie | 0 | 1 | leading |
| `space` | Prostor | −0.55 | 1.8 | space |

Body copy is exact and non-metaphorical, e.g. Třetiny: "Subjekt leží na třetinové
čáře místo ve středu — pohled má kam plynout a záběr působí dynamičtěji." (Final
wording tuned during implementation; each names the concrete difference.)

## Scene change — `framing`

`PhotoParams` gains `framing: number` (default 1). In `StudioScene` the camera
distance becomes:

```ts
const dist = BASE_DISTANCE * (current.focal / BASE_FOCAL) * current.framing;
```

`framing` is lerped like the other params. Default 1 everywhere except the negative-
space composition (1.8), which dollies the camera back so the subject is small with
empty space around it — no head-scaling. `DEFAULT_PARAMS.framing = 1`.

## Components

### `CompositionPicker.tsx` (bespoke card, like `Capstone`)

Section 08 renders this instead of the standard card when `composition: true` flag is
set on the section (new `Section` flag, mirrors `capstone`). Props:

```ts
interface Props {
  num: string; title: string;
  selected: number;            // index into COMPOSITIONS
  onSelect: (i: number) => void;
  onHover: (i: number | null) => void;
  active: boolean;
}
```

Renders: card num/title, the selected composition's `body`, and a row of chips
(`.f101-chip`, one per composition). Chip click → `onSelect`; mouseenter/leave →
`onHover`. Active chip highlighted.

### `CompositionOverlay.tsx` (stage overlay, like `ExposureMeter`)

Rendered inside `.f101-stage`. Props: `kind: OverlayKind`, `subjectX: number`
(0..1 screen fraction), `show: boolean`. Draws an SVG (`viewBox 0 0 100 100`,
`preserveAspectRatio none`, full-bleed, `pointer-events:none`) for the kind:

- `thirds` — vertical lines x=33.33,66.66; horizontal y=33.33,66.66
- `center` — vertical line x=50 (+ subtle horizontal y=50)
- `golden` — vertical x=38.2,61.8; horizontal y=38.2,61.8
- `leading` — 4 lines from the corners to `(subjectX*100, ~55)`
- `space` — translucent rect over the empty half (opposite the subject) + a small
  "prostor" caption

Opacity-animated via a `--on` class so it fades with `show`.

### Subject screen-X mapping

Shared helper (in `compositions.ts`) used by the App to feed `CompositionOverlay`:

```ts
// subject world X = comp * 0.7 (StudioScene). Approx to screen fraction 0..1.
export function subjectScreenX(comp: number): number {
  return Math.min(1, Math.max(0, 0.5 + comp * 0.32));
}
```

Tuned so the thirds/golden subject sits near the matching guide line. Exactness is
not required — the grid is the teaching device, the subject sits near its line.

## Wiring in `Foceni101App`

- State: `const [compSel, setCompSel] = useState(0); const [compHover, setCompHover] = useState<number|null>(null);`
- Target memo, when `sec.composition`: apply the **hovered** composition's scene if
  hovering, else the **selected** one — so hover previews the placement too:
  ```ts
  const cmp = COMPOSITIONS[compHover ?? compSel];
  base.composition = cmp.comp;
  base.framing = cmp.framing;
  ```
  (deps add `compSel`, `compHover`.)
- Overlay: render `<CompositionOverlay kind={cmp.overlay} subjectX={subjectScreenX(cmp.comp)} show={SECTIONS[activeIndex]?.composition === true} />` on the stage, where `cmp` is the hovered-or-selected composition.
- Render branch in `SECTIONS.map`: `s.composition ? <CompositionPicker .../> : (existing card)`.
- Remove the old inline `kompozice` thirds block (`SECTIONS[activeIndex]?.id === "kompozice" && ...`).

## Config in `sections.ts`

Section `kompozice` (08): drop its `control`, add `composition: true`. Title stays
"Kompozice"; its `body` becomes a short intro ("Kam v záběru subjekt patří. Vyber a
porovnej."). The five explanations live in `COMPOSITIONS`, not the section.

`types.ts`: `Section` gains `composition?: boolean`. `PhotoParams` gains `framing`.

## Cleanup

- Remove `composition` from the slider/`control` path for section 08 (now bespoke).
- Remove `.f101-thirds*` inline render in App (overlay covers thirds now). Keep or
  fold the `.f101-thirds` CSS into the overlay styling.

## Testing

`compositions.test.ts` (vitest):
- every `COMPOSITIONS[i].comp` ∈ [−1, 1] and `framing` ≥ 1
- every `overlay` is one of the 5 `OverlayKind` values
- `subjectScreenX(0)` ≈ 0.5; `subjectScreenX(0.5) > 0.5`; output clamped to [0,1]

Existing vitest baseline (166 pass / 4 pre-existing jsdom fails) must not regress.
Visual verification via the headless-chromium probe (screenshots of each chip +
hover) at the end.

## Files

| File | Action |
|---|---|
| `modules/foceni-101/components/compositions.ts` | NEW — config + `subjectScreenX` |
| `modules/foceni-101/components/CompositionPicker.tsx` | NEW — chip card |
| `modules/foceni-101/components/CompositionOverlay.tsx` | NEW — SVG guides |
| `modules/foceni-101/__tests__/compositions.test.ts` | NEW — config + mapping tests |
| `modules/foceni-101/components/types.ts` | EDIT — `Section.composition?`, `PhotoParams.framing` |
| `modules/foceni-101/components/sections.ts` | EDIT — section 08 → `composition: true`, intro body |
| `modules/foceni-101/components/StudioScene.tsx` | EDIT — `framing` into camera distance |
| `modules/foceni-101/components/Foceni101App.tsx` | EDIT — state, target, overlay, render branch, remove old thirds |
| `app/globals.css` | EDIT — `.f101-chip*`, `.f101-comp-overlay*`; reuse/extend thirds styling |
| `modules/foceni-101/MODULE.md` | EDIT — document composition rebuild |

## Explicitly skipped (YAGNI)

- Head-scaling for negative space — camera dolly (`framing`) is enough and cleaner.
- A golden spiral path — phi grid lines convey the ratio with far less code.
- Per-composition camera angle/height changes — out of scope; only X + framing vary.
- Generalizing the bespoke-card mechanism (capstone + picker are two one-offs).
