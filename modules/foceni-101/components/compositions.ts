export type OverlayKind = "thirds" | "center" | "golden" | "leading" | "space" | "frame";

/**
 * One background ball, authored in **normalized screen space** so a layout looks
 * the same on a 16:9 desktop and a tall phone: `u`/`v` are −1..1 fractions of the
 * frame's half-width / half-height *at that ball's depth*, `z` is metres behind
 * the subject (negative = in front of it, toward the camera), `s` is a radius
 * multiplier. StudioScene converts u/v to world X/Y each frame.
 */
export interface Orb {
  u: number;
  v: number;
  z: number;
  s: number;
}

export interface Composition {
  /** Also the messages key: `foceni101.comps.<id>.{label,body}`. */
  id: string;
  /** Subject horizontal placement, −1..1 (fraction of the frame's half-width). */
  comp: number;
  /** Subject vertical placement, −1..1 (positive = higher in frame). */
  compY: number;
  /** Camera-distance multiplier (1 = normal, >1 = subject smaller). */
  framing: number;
  /** Where the rule says the subject goes, as 0..1 screen fractions (drives the overlay). */
  markX: number;
  markY: number;
  overlay: OverlayKind;
}

export const ORB_COUNT = 14;
const PHI = 1.618033988749895;

/**
 * The model is centred on its bounding box, which includes the shoulders, so its
 * origin sits ≈9 % of the frame below eye level. Compositions target the *eyes*
 * (that is where a portrait's thirds intersection belongs), so the placement is
 * pushed down by that much.
 * ponytail: constant in frame fractions; only exact at framing = 1, close enough elsewhere.
 */
const EYE_OFFSET = 0.09;

/** Place the subject's eyes at a 0..1 screen point → scene placement params. */
function placeAt(markX: number, markY: number) {
  return {
    markX,
    markY,
    comp: (markX - 0.5) * 2,
    compY: (0.5 - markY) * 2 - EYE_OFFSET * 2,
  };
}

/** Subject sits on the phi intersection (61.8 % across, 38.2 % down). */
const GOLDEN_X = 0.618 * 2 - 1; // 0.236
const GOLDEN_Y = 1 - 0.382 * 2; // 0.236

function orbs(list: Partial<Orb>[]): Orb[] {
  const out = list.map((o) => ({ u: o.u ?? 0, v: o.v ?? 0, z: o.z ?? 1, s: o.s ?? 1 }));
  // Layouts that use fewer balls park the rest at scale 0 (they shrink away
  // instead of popping out of existence mid-tween).
  while (out.length < ORB_COUNT) out.push({ u: 0, v: 0, z: 1.2, s: 0 });
  return out.slice(0, ORB_COUNT);
}

/** Mirror `half` about the vertical centre line → a symmetric set. */
function mirrored(half: Partial<Orb>[]): Orb[] {
  return orbs(half.flatMap((o) => [o, { ...o, u: -(o.u ?? 0) }]));
}

/**
 * Logarithmic (golden) spiral converging on the subject: r grows by φ² every
 * half turn, ball size grows with r. The eye rides the wide outer arm inward and
 * lands on the face — the part of the golden ratio a phi *grid* can't show.
 */
function goldenSpiral(): Orb[] {
  const R0 = 0.12;
  const TH_MAX = 7.08; // ≈2.25 turns; ends at r ≈ 1.05 (frame edge)
  const PHASE = 2.2; // rad — opens up-left, so the arm sweeps across the frame
  return orbs(
    Array.from({ length: ORB_COUNT }, (_, i) => {
      const th = (i / (ORB_COUNT - 1)) * TH_MAX;
      const r = R0 * Math.pow(PHI, (2 * th) / Math.PI);
      return {
        u: GOLDEN_X + r * Math.cos(th + PHASE),
        v: GOLDEN_Y + r * Math.sin(th + PHASE),
        z: 0.95,
        s: 0.5 + r * 1.1,
      };
    }),
  );
}

/**
 * Two rows running away from the camera like the edges of a path: wide apart and
 * low in the frame up close, tight and at eye level in the distance, so they
 * converge on the face. Depth does the work — hence the big `z` spread.
 */
function leadingRows(): Orb[] {
  const per = ORB_COUNT / 2;
  return orbs(
    Array.from({ length: ORB_COUNT }, (_, i) => {
      const side = i < per ? -1 : 1;
      const t = (i % per) / (per - 1);
      const e = Math.pow(t, 1.6); // ease: the near end stays spread out longer
      return {
        u: side * (1.0 - 0.94 * e),
        v: -0.92 + 0.8 * e,
        // Starts in front of the subject, ends just short of the backdrop wall
        // (world z −1.6) — go past it and the far balls vanish behind it.
        z: -0.7 + 2.1 * t,
        s: 0.55 + 0.5 * t,
      };
    }),
  );
}

/**
 * Ring of big, close, heavily out-of-focus balls in front of the subject. They
 * have to overlap to read as a frame rather than a necklace of dots — hence the
 * large radius multiplier and the short camera distance.
 */
function frameRing(): Orb[] {
  return orbs(
    Array.from({ length: ORB_COUNT }, (_, i) => {
      const a = (i / ORB_COUNT) * Math.PI * 2 + 0.22;
      return { u: Math.cos(a) * 1.08, v: Math.sin(a) * 1.02, z: -0.85, s: 1.9 };
    }),
  );
}

export const ORB_LAYOUTS: Record<string, Orb[]> = {
  // Counterweight: the subject sits right, the mass of balls balances it left.
  thirds: orbs([
    { u: -0.62, v: -0.15, z: 0.9, s: 1.2 },
    { u: -0.38, v: -0.42, z: 1.1, s: 0.9 },
    { u: -0.78, v: -0.5, z: 1.25, s: 1.1 },
    { u: -0.45, v: 0.12, z: 1.0, s: 0.8 },
    { u: -0.9, v: 0.05, z: 1.3, s: 1.0 },
    { u: -0.28, v: -0.68, z: 0.85, s: 0.7 },
    { u: -0.66, v: -0.75, z: 1.15, s: 0.85 },
    { u: -0.52, v: -0.6, z: 1.4, s: 0.6 },
    { u: -0.84, v: -0.28, z: 1.05, s: 0.7 },
    { u: -0.2, v: -0.3, z: 1.35, s: 0.55 },
  ]),
  center: mirrored([
    { u: 0.3, v: 0.4, z: 1.0, s: 0.9 },
    { u: 0.55, v: -0.05, z: 1.15, s: 1.1 },
    { u: 0.78, v: 0.35, z: 1.3, s: 0.8 },
    { u: 0.42, v: -0.5, z: 0.95, s: 0.7 },
    { u: 0.9, v: -0.35, z: 1.25, s: 1.0 },
    { u: 0.22, v: 0.72, z: 1.1, s: 0.6 },
    { u: 0.68, v: 0.68, z: 1.35, s: 0.75 },
  ]),
  golden: goldenSpiral(),
  leading: leadingRows(),
  // Negative space: a few small balls hugging the subject's corner, rest empty.
  space: orbs([
    { u: 0.78, v: -0.55, z: 1.3, s: 0.7 },
    { u: 0.95, v: -0.75, z: 1.45, s: 0.5 },
    { u: 0.62, v: -0.3, z: 1.2, s: 0.4 },
  ]),
  frame: frameRing(),
  /** Used by every non-composition section — the ambient bokeh scatter. */
  default: orbs([
    { u: -0.72, v: 0.38, z: 0.95, s: 1.0 },
    { u: 0.55, v: 0.62, z: 1.2, s: 0.85 },
    { u: -0.3, v: -0.55, z: 1.35, s: 1.1 },
    { u: 0.82, v: -0.12, z: 0.85, s: 0.7 },
    { u: -0.9, v: -0.25, z: 1.4, s: 0.95 },
    { u: 0.18, v: 0.8, z: 1.05, s: 0.6 },
    { u: -0.5, v: 0.05, z: 1.45, s: 1.05 },
    { u: 0.68, v: -0.68, z: 1.15, s: 0.8 },
    { u: -0.15, v: 0.45, z: 0.9, s: 0.65 },
    { u: 0.35, v: -0.35, z: 1.3, s: 1.15 },
    { u: -0.85, v: 0.72, z: 1.25, s: 0.75 },
    { u: 0.95, v: 0.4, z: 1.4, s: 0.9 },
    { u: -0.42, v: -0.85, z: 1.0, s: 0.7 },
    { u: 0.05, v: -0.15, z: 1.5, s: 1.0 },
  ]),
};

export const COMPOSITIONS: Composition[] = [
  { id: "thirds", ...placeAt(2 / 3, 1 / 3), framing: 1, overlay: "thirds" },
  { id: "center", ...placeAt(0.5, 0.45), framing: 1, overlay: "center" },
  { id: "golden", ...placeAt(0.618, 0.382), framing: 1, overlay: "golden" },
  { id: "leading", ...placeAt(0.5, 0.42), framing: 1, overlay: "leading" },
  // Pulled back and pushed right: on desktop the copy card owns the left third,
  // so the emptiness reads only if the subject sits on the other side.
  { id: "space", ...placeAt(0.8, 0.42), framing: 1.8, overlay: "space" },
  { id: "frame", ...placeAt(0.5, 0.44), framing: 1, overlay: "frame" },
];

/** The golden spiral as a normalized-screen polyline (`0..100` viewBox space). */
export function goldenSpiralPoints(steps = 90): string {
  const R0 = 0.12;
  const TH_MAX = 7.08;
  const PHASE = 2.2;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * TH_MAX;
    const r = R0 * Math.pow(PHI, (2 * th) / Math.PI);
    const u = GOLDEN_X + r * Math.cos(th + PHASE);
    const v = GOLDEN_Y + r * Math.sin(th + PHASE);
    pts.push(`${(50 + u * 50).toFixed(2)},${(50 - v * 50).toFixed(2)}`);
  }
  return pts.join(" ");
}
