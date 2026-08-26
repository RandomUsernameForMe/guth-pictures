export type ColorSet = {
  bg: string;
  bgElevated: string;
  bgOverlay: string;
  surface: string;
  text: string;
  textMuted: string;
  textGhost: string;
  /** Fills and the primary CTA. */
  accent: string;
  accentHover: string;
  /** Hairlines, eyebrow borders, rules, numerals — never a fill. */
  accentSecondary: string;
  /** Tint of the full-page film grain overlay. */
  grain: string;
};

export const COLOR_KEYS: (keyof ColorSet)[] = [
  "bg",
  "bgElevated",
  "bgOverlay",
  "surface",
  "text",
  "textMuted",
  "textGhost",
  "accent",
  "accentHover",
  "accentSecondary",
  "grain",
];

export const CSS_VAR_MAP: Record<keyof ColorSet, string> = {
  bg:              "--color-bg",
  bgElevated:      "--color-bg-elevated",
  bgOverlay:       "--color-bg-overlay",
  surface:         "--color-surface",
  text:            "--color-text",
  textMuted:       "--color-text-muted",
  textGhost:       "--color-text-ghost",
  accent:          "--color-accent",
  accentHover:     "--color-accent-hover",
  accentSecondary: "--color-accent-secondary",
  grain:           "--color-grain",
};
