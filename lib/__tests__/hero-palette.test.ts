import { describe, it, expect } from "vitest";
import { hexToOklch, paletteFromColors, paletteStyle } from "@/lib/hero-palette";

const parse = (css: string) => css.match(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/)!.slice(1).map(Number);

describe("hexToOklch", () => {
  it("converts white and a saturated red", () => {
    expect(hexToOklch("#FFFFFF").l).toBeCloseTo(1, 3);
    expect(hexToOklch("#FFFFFF").c).toBeCloseTo(0, 3);
    const red = hexToOklch("#FF0000");
    expect(red.l).toBeCloseTo(0.628, 2);
    expect(red.c).toBeCloseTo(0.258, 2);
    expect(red.h).toBeCloseTo(29.2, 0);
  });
});

describe("paletteFromColors", () => {
  // Real Cloudinary output for the current homepage hero (teal backdrop, red garment).
  const hero: [string, number][] = [
    ["#152527", 23.5], ["#7F0105", 16.2], ["#758082", 13.9], ["#C2C8C9", 7.7],
    ["#D5D9D7", 7], ["#162524", 7], ["#3C0001", 5.3], ["#030E10", 2.6],
  ];

  it("tints paper and ink with the dominant hue and takes the accent from the most saturated colour", () => {
    const p = paletteFromColors(hero);
    const [, paperC, paperH] = parse(p.paper);
    const [, , accentH] = parse(p.accent);
    expect(paperC).toBeGreaterThan(0);
    expect(paperH).toBeGreaterThan(180);
    expect(paperH).toBeLessThan(230);
    expect(accentH).toBeLessThan(40);
  });

  it("keeps lightness fixed regardless of the photo, so contrast never depends on it", () => {
    for (const colors of [hero, [["#00FF66", 90]], [["#FFFF00", 50], ["#0000FF", 50]]] as [string, number][][]) {
      const p = paletteFromColors(colors);
      expect(parse(p.paper)[0]).toBe(0.955);
      expect(parse(p.ink)[0]).toBe(0.2);
      expect(parse(p.accent)[0]).toBe(0.46);
    }
  });

  it("falls back to the ink as accent for a monochrome photo", () => {
    const p = paletteFromColors([["#121212", 86.4], ["#757575", 12.8]]);
    expect(p.accent).toBe(p.ink);
    expect(parse(p.paper)[1]).toBe(0);
  });
});

describe("paletteStyle", () => {
  it("scopes the palette to the homepage and the body that contains it", () => {
    const css = paletteStyle({ paper: "oklch(0.955 0.01 200)", ink: "oklch(0.2 0.02 200)", accent: "oklch(0.46 0.14 29)" });
    expect(css).toBe(":is(body:has(.editorial-home),.editorial-home){--editorial-paper:oklch(0.955 0.01 200);--editorial-ink:oklch(0.2 0.02 200);--editorial-accent:oklch(0.46 0.14 29)}");
  });
});
