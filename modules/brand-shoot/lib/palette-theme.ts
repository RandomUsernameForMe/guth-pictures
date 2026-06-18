// Client-safe, dependency-free. Maps a color palette (3–6 hex) onto the brand-shoot
// client-page CSS variables (--bsp-*), choosing background / surface / text / accent by
// luminance + saturation, with a WCAG contrast guard so text stays legible.

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

const toHex = ({ r, g, b }: Rgb) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

// WCAG relative luminance (0..1)
function luminance({ r, g, b }: Rgb): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// HSV-style saturation (0..1) — good enough to pick the most chromatic color
function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const DARK: Rgb = { r: 10, g: 10, b: 11 }; // #0A0A0B
const LIGHT: Rgb = { r: 242, g: 240, b: 235 }; // #F2F0EB

/**
 * Returns a CSS-var map for React `style` (e.g. { "--bsp-bg": "#101216", ... }).
 * Empty object when the palette is too small to theme from (caller falls back to defaults).
 */
export function paletteToTheme(colors: string[]): Record<string, string> {
  const rgb = colors.map(parseHex).filter(Boolean) as Rgb[];
  if (rgb.length < 2) return {};

  const sorted = [...rgb].sort((a, b) => luminance(a) - luminance(b));
  const darkest = sorted[0];
  const lightest = sorted[sorted.length - 1];
  // Light base only when the palette has a genuine light region to sit on (a very light color
  // + at least two light-ish colors) — otherwise a single light accent shouldn't flip a dark
  // palette. A near-black color present in a light palette becomes the text instead of the bg.
  const lightCount = rgb.filter((c) => luminance(c) > 0.5).length;
  const darkBase = !(luminance(lightest) > 0.75 && lightCount >= 2);

  let bg = darkBase ? darkest : lightest;
  let text = darkBase ? lightest : darkest;

  // Accent = most saturated color that isn't the bg/text pick; fallback handles mono palettes.
  const candidates = rgb.filter((c) => c !== bg && c !== text);
  const pool = candidates.length ? candidates : rgb;
  let accent = pool.reduce((best, c) => (saturation(c) > saturation(best) ? c : best), pool[0]);
  if (saturation(accent) < 0.12) {
    // near-monochrome: pick the color most distant in luminance from bg for some pop
    accent = pool.reduce(
      (best, c) => (Math.abs(luminance(c) - luminance(bg)) > Math.abs(luminance(best) - luminance(bg)) ? c : best),
      pool[0]
    );
  }

  // Contrast guard: force a safe text color if the palette can't carry legible text.
  if (contrast(text, bg) < 4.5) text = contrast(LIGHT, bg) >= contrast(DARK, bg) ? LIGHT : DARK;

  const accentContrast = luminance(accent) > 0.5 ? DARK : LIGHT;

  return {
    "--bsp-bg": toHex(bg),
    "--bsp-bg-elevated": toHex(mix(bg, text, 0.05)),
    "--bsp-surface": toHex(mix(bg, text, 0.08)),
    "--bsp-text": toHex(text),
    "--bsp-text-muted": toHex(mix(text, bg, 0.38)),
    "--bsp-border": toHex(mix(bg, text, 0.16)),
    "--bsp-border-sub": toHex(mix(bg, text, 0.09)),
    "--bsp-accent": toHex(accent),
    "--bsp-accent-contrast": toHex(accentContrast),
  };
}
