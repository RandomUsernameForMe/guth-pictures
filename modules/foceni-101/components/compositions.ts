export type OverlayKind = "thirds" | "center" | "golden" | "leading" | "space";

export interface Composition {
  /** Also the messages key: `foceni101.comps.<id>.{label,body}`. */
  id: string;
  /** Subject horizontal placement, -1..1 (maps to scene `composition`). */
  comp: number;
  /** Camera-distance multiplier (1 = normal, >1 = subject smaller). */
  framing: number;
  overlay: OverlayKind;
}

export const COMPOSITIONS: Composition[] = [
  { id: "thirds", comp: 0.5, framing: 1, overlay: "thirds" },
  { id: "center", comp: 0, framing: 1, overlay: "center" },
  { id: "golden", comp: 0.33, framing: 1, overlay: "golden" },
  { id: "leading", comp: 0, framing: 1, overlay: "leading" },
  { id: "space", comp: -0.55, framing: 1.8, overlay: "space" },
];

/** Subject world X = comp * 0.7 in the scene; approximate to screen fraction 0..1. */
export function subjectScreenX(comp: number): number {
  return Math.min(1, Math.max(0, 0.5 + comp * 0.32));
}
