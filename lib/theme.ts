import "server-only";
import { getKv } from "./kv";

export type ColorSet = {
  bg: string;
  bgElevated: string;
  bgOverlay: string;
  surface: string;
  text: string;
  textMuted: string;
  textGhost: string;
  accent: string;
  accentHover: string;
};

export type ThemeColors = {
  dark: ColorSet;
  light: ColorSet;
};

export const defaultColors: ThemeColors = {
  dark: {
    bg:          "#0A0A0B",
    bgElevated:  "#111113",
    bgOverlay:   "#18181C",
    surface:     "#1E1E23",
    text:        "#F2F0EB",
    textMuted:   "#9B9899",
    textGhost:   "#5C5A5E",
    accent:      "#C8A96E",
    accentHover: "#D4B87A",
  },
  light: {
    bg:          "#C8CDD6",
    bgElevated:  "#BFC5CF",
    bgOverlay:   "#B6BCC8",
    surface:     "#ADB3C1",
    text:        "#0F172A",
    textMuted:   "#475569",
    textGhost:   "#94A3B8",
    accent:      "#6B3A1F",
    accentHover: "#5A3019",
  },
};

const KV_KEY = "theme-colors";

export async function getThemeColors(): Promise<ThemeColors> {
  const kv = await getKv();
  if (!kv) return defaultColors;
  try {
    const stored = await kv.get<ThemeColors>(KV_KEY);
    if (!stored) return defaultColors;
    return stored;
  } catch {
    return defaultColors;
  }
}

export async function setThemeColors(colors: ThemeColors): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not available");
  await kv.set(KV_KEY, colors);
}

/** Generates a <style> block with CSS var overrides for both themes */
export function buildThemeStyle(colors: ThemeColors): string {
  const render = (cls: string, c: ColorSet) =>
    `${cls}{--color-bg:${c.bg};--color-bg-elevated:${c.bgElevated};--color-bg-overlay:${c.bgOverlay};--color-surface:${c.surface};--color-text:${c.text};--color-text-muted:${c.textMuted};--color-text-ghost:${c.textGhost};--color-accent:${c.accent};--color-accent-hover:${c.accentHover};}`;
  return render(":root,.dark", colors.dark) + render(".light", colors.light);
}
