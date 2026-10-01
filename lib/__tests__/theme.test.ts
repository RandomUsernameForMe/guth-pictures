import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/kv", () => ({ getKv: vi.fn() }));

import { getKv } from "@/lib/kv";
import { getThemeColors, buildThemeStyle } from "@/lib/theme";
import { COLOR_KEYS, CSS_VAR_MAP } from "@/lib/theme-types";
import type { ColorSet } from "@/lib/theme-types";
import { defaultColors } from "@/lib/theme-presets";

beforeEach(() => {
  vi.mocked(getKv).mockReset();
});

describe("buildThemeStyle", () => {
  const colors = Object.fromEntries(
    COLOR_KEYS.map((k, i) => [k, `#0000${String(i).padStart(2, "0")}`]),
  ) as ColorSet;

  it("wraps declarations in :root{}", () => {
    const css = buildThemeStyle(colors);
    expect(css.startsWith(":root{")).toBe(true);
    expect(css.endsWith("}")).toBe(true);
  });

  it.each(COLOR_KEYS)("declares %s through CSS_VAR_MAP", (k) => {
    expect(buildThemeStyle(colors)).toContain(`${CSS_VAR_MAP[k]}:${colors[k]};`);
  });

  it("emits exactly one declaration per key, in order", () => {
    const expected = `:root{${COLOR_KEYS.map((k) => `${CSS_VAR_MAP[k]}:${colors[k]};`).join("")}}`;
    expect(buildThemeStyle(colors)).toBe(expected);
  });
});

describe("getThemeColors", () => {
  it("returns defaults when KV is unavailable", async () => {
    vi.mocked(getKv).mockResolvedValue(null);
    expect(await getThemeColors()).toBe(defaultColors);
  });

  it("returns defaults when nothing is stored", async () => {
    const get = vi.fn().mockResolvedValue(null);
    vi.mocked(getKv).mockResolvedValue({ get } as any);
    expect(await getThemeColors()).toBe(defaultColors);
  });

  it("returns defaults when kv.get throws", async () => {
    const get = vi.fn().mockRejectedValue(new Error("boom"));
    vi.mocked(getKv).mockResolvedValue({ get } as any);
    expect(await getThemeColors()).toBe(defaultColors);
  });

  it("returns stored colors", async () => {
    const stored = { ...defaultColors, accent: "#123456" };
    const get = vi.fn().mockResolvedValue(stored);
    vi.mocked(getKv).mockResolvedValue({ get } as any);
    expect(await getThemeColors()).toEqual(stored);
    expect(get).toHaveBeenCalledWith("theme-colors-v2");
  });
});
