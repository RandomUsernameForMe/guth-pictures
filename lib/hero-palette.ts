/** Cloudinary `colors` output: [hex, percentage of the image]. */
export type ImageColors = [string, number][];
export type HeroPalette = { paper: string; ink: string; accent: string };
type Oklch = { l: number; c: number; h: number };

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

// sRGB → OKLab → OKLCH (Björn Ottosson's reference matrices)
export function hexToOklch(hex: string): Oklch {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => toLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    c: Math.hypot(A, B),
    h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360,
  };
}

const NEUTRAL: Oklch = { l: 0, c: 0, h: 0 };
const round = (v: number) => Math.round(v * 1000) / 1000;
const oklch = (l: number, c: number, h: number) => `oklch(${l} ${round(c)} ${round(c === 0 ? 0 : h)})`;

/** Only hue and a capped chroma come from the photo; lightness is fixed so text contrast holds for any image. */
export function paletteFromColors(colors: ImageColors): HeroPalette {
  const parsed = colors.map(([hex, pct]) => ({ ...hexToOklch(hex), pct }));
  const seed = parsed.find((x) => x.c >= 0.02 && x.pct >= 5) ?? NEUTRAL;
  const vivid = parsed.filter((x) => x.pct >= 2).sort((a, b) => b.c - a.c)[0];
  const ink = oklch(0.2, Math.min(seed.c, 0.04), seed.h);
  return {
    paper: oklch(0.955, Math.min(seed.c * 0.5, 0.02), seed.h),
    ink,
    accent: vivid && vivid.c >= 0.05 ? oklch(0.46, Math.min(vivid.c, 0.14), vivid.h) : ink,
  };
}

/** Body-level scope lets the layout's footer follow the homepage palette. */
export const paletteStyle = (p: HeroPalette) =>
  `:is(body:has(.editorial-home),.editorial-home){--editorial-paper:${p.paper};--editorial-ink:${p.ink};--editorial-accent:${p.accent}}`;
