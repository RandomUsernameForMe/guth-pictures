import { holdExposureFor } from "./light";
import { DEFAULT_PARAMS } from "./types";

export type CapLeg = "aperture" | "shutter" | "iso";

export interface CapVals {
  aperture: number;
  shutter: number;
  iso: number;
}

export interface CapstoneMechanic {
  /** Slider range per leg. The restricted leg gets a narrow range. */
  ranges: Record<CapLeg, { min: number; max: number; step: number }>;
  /** Which leg is held in a narrow range by the scenario's goal. */
  restricted: CapLeg;
  /** Short reason shown as a badge on the restricted leg. */
  reason: string;
  /** Balanced reference point — pins scene exposure so this reads correct. */
  ref: CapVals;
  /** Starting values, deliberately off-balance. */
  init: CapVals;
}

// Keyed by section id. Each scenario locks one leg's range for a stated reason,
// leaving the other two free — so the only way to fix exposure is to trade them.
export const CAPSTONES: Record<string, CapstoneMechanic> = {
  // Excess light: clona held wide for blur → too bright → cut čas + ISO.
  "capstone-blur": {
    ranges: {
      aperture: { min: 1.8, max: 3.2, step: 0.1 },
      shutter: { min: 0, max: 1, step: 0.01 },
      iso: { min: 100, max: 6400, step: 100 },
    },
    restricted: "aperture",
    reason: "kvůli rozostření",
    ref: { aperture: 1.8, shutter: 0.25, iso: 100 },
    init: { aperture: 1.8, shutter: 0.7, iso: 6400 },
  },
  // Deficit light: čas held fast to freeze motion → too dark → add clona + ISO.
  "capstone-freeze": {
    ranges: {
      aperture: { min: 1.8, max: 16, step: 0.1 },
      shutter: { min: 0, max: 0.2, step: 0.01 },
      iso: { min: 100, max: 6400, step: 100 },
    },
    restricted: "shutter",
    reason: "kvůli zmrazení pohybu",
    ref: { aperture: 4, shutter: 0.07, iso: 400 },
    init: { aperture: 11, shutter: 0.05, iso: 100 },
  },
};

/** Scene exposure that makes the scenario's ref point read correct (meter at 0). */
export function capstoneExposure(m: CapstoneMechanic): number {
  return holdExposureFor({ ...DEFAULT_PARAMS, ...m.ref });
}
