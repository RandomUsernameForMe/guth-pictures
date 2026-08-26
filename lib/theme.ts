import "server-only";
import { getKv } from "./kv";
import type { ColorSet } from "./theme-types";
import { CSS_VAR_MAP, COLOR_KEYS } from "./theme-types";
import { defaultColors } from "./theme-presets";
export type { ColorSet } from "./theme-types";
export { defaultColors } from "./theme-presets";

// v2: flat ColorSet (no light mode), plus accentSecondary and grain.
// The old "theme-colors" key holds an incompatible shape and is ignored.
const KV_KEY = "theme-colors-v2";

export async function getThemeColors(): Promise<ColorSet> {
  const kv = await getKv();
  if (!kv) return defaultColors;
  try {
    const stored = await kv.get<ColorSet>(KV_KEY);
    if (!stored) return defaultColors;
    return stored;
  } catch {
    return defaultColors;
  }
}

export async function setThemeColors(colors: ColorSet): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not available");
  await kv.set(KV_KEY, colors);
}

/** Generates a <style> block with CSS var overrides */
export function buildThemeStyle(colors: ColorSet): string {
  const decls = COLOR_KEYS.map((k) => `${CSS_VAR_MAP[k]}:${colors[k]};`).join("");
  return `:root{${decls}}`;
}
