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
