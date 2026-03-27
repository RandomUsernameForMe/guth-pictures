import "server-only";
import { getKv } from "./kv";
import type { ThemeColors, ColorSet } from "./theme-types";
import { defaultColors } from "./theme-types";
export type { ColorSet, ThemeColors } from "./theme-types";
export { defaultColors } from "./theme-types";

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
