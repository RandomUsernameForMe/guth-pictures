import { describe, it, expect } from "vitest";
import { themePresets, defaultColors } from "../theme-presets";
import { COLOR_KEYS } from "../theme-types";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** WCAG relative luminance */
function luminance(hex: string): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("theme presets", () => {
  it("has a unique id per preset", () => {
    const ids = themePresets.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defaults to Víno", () => {
    expect(defaultColors).toBe(themePresets[0].colors);
    expect(themePresets[0].id).toBe("vino");
  });

  // The admin API rejects anything that isn't a full set of 6-digit hexes,
  // so a preset missing a key would be unsaveable.
  it.each(themePresets)("$label has every key as a 6-digit hex", ({ colors }) => {
    expect(Object.keys(colors).sort()).toEqual([...COLOR_KEYS].sort());
    for (const key of COLOR_KEYS) {
      expect(colors[key], key).toMatch(HEX);
    }
  });

  it.each(themePresets)("$label keeps accent readable on the background", ({ colors }) => {
    expect(contrast(colors.accent, colors.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themePresets)("$label keeps body text readable on the background", ({ colors }) => {
    expect(contrast(colors.text, colors.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.textMuted, colors.bg)).toBeGreaterThanOrEqual(4.5);
  });
});
