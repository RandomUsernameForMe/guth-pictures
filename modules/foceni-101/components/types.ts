// Live state of the virtual camera + scene. Every section tweens these.
export interface PhotoParams {
  /** Exposure / brightness (key light power). 0.2 = dark, 2 = blown out. 1 = balanced. */
  exposure: number;
  /** Aperture as f-number. Low (1.4) = shallow DoF / blurred background. High (16) = all sharp. */
  aperture: number;
  /** Shutter "slowness" 0..1. 0 = fast (frozen), 1 = slow (motion blur). */
  shutter: number;
  /** ISO sensitivity. Higher = brighter but more grain. */
  iso: number;
  /** Focal length in mm. 24 = wide (distortion), 135 = tele (compression). */
  focal: number;
  /** Camera vertical angle. -1 = low (looking up, hero), 0 = eye level, 1 = high (looking down). */
  angle: number;
  /** White balance in Kelvin. 3000 = warm/orange, 5500 = neutral, 8000 = cool/blue. */
  whiteBalance: number;
  /** Subject horizontal placement as a fraction of the frame's half-width. -1 = left edge, 0 = centred, 1 = right edge. */
  composition: number;
  /** Subject vertical placement as a fraction of the frame's half-height. -1 = bottom, 0 = centred, 1 = top. */
  compositionY: number;
  /** Camera-distance multiplier for framing. 1 = normal; >1 dollies back (subject smaller). */
  framing: number;
}

export const DEFAULT_PARAMS: PhotoParams = {
  exposure: 1,
  aperture: 5.6,
  shutter: 0,
  iso: 100,
  focal: 50,
  angle: 0,
  whiteBalance: 5500,
  composition: 0,
  compositionY: 0,
  framing: 1,
};

export type ParamKey = keyof PhotoParams;

export interface SectionControl {
  param: ParamKey;
  min: number;
  max: number;
  step: number;
  /** Label shown above the slider. */
  label: string;
  /** Format the live value for display. */
  fmt: (v: number) => string;
  /** Render the slider right-to-left, so "more light" is always to the right (aperture: low f = open). */
  invert?: boolean;
}

export interface Section {
  id: string;
  /** Two-digit index shown mono, e.g. "01". */
  num: string;
  title: string;
  /** Playful, jargon-free body copy (localized via buildSections). */
  body: string;
  /** Params the scene tweens to when this section scrolls into view. */
  target: Partial<PhotoParams>;
  /** Optional interactive control ("zkus sám"). Intro has none. */
  control?: SectionControl;
  /** Show the on-scene exposure meter while this section is active. */
  meter?: boolean;
  /** Auto-balance exposure so only this section's own effect shows (no brightness change). */
  holdLight?: boolean;
  /** Render the bespoke two-slider capstone card instead of a standard card. */
  capstone?: boolean;
  /** Render the bespoke composition picker card instead of a standard card. */
  composition?: boolean;
  /** Render the finale CTA card instead of a standard card. */
  cta?: boolean;
  /** Show the orbiter (glowing ball + its light + trail) while this section is active. */
  orb?: boolean;
}
