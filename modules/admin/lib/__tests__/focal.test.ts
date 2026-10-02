import { describe, expect, it } from "vitest";
import { formatFocal, nudgeFocal, parseFocal, toFocal } from "../focal";

const rect = { left: 100, top: 50, width: 200, height: 100 };

describe("focal", () => {
  it("maps a pointer position inside the image to percentages", () => {
    expect(toFocal(100, 50, rect)).toBe("0% 0%");
    expect(toFocal(200, 100, rect)).toBe("50% 50%");
    expect(toFocal(300, 150, rect)).toBe("100% 100%");
    expect(toFocal(133, 83, rect)).toBe("17% 33%");
  });

  it("clamps positions outside the image", () => {
    expect(toFocal(0, 500, rect)).toBe("0% 100%");
    expect(toFocal(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toBe("50% 50%");
  });

  it("parses valid values and falls back to center", () => {
    expect(parseFocal("40% 30%")).toEqual({ x: 40, y: 30 });
    expect(parseFocal("center")).toEqual({ x: 50, y: 50 });
    expect(parseFocal("")).toEqual({ x: 50, y: 50 });
  });

  it("nudges within bounds", () => {
    expect(nudgeFocal("50% 50%", 1, 0)).toBe("51% 50%");
    expect(nudgeFocal("98% 2%", 10, -10)).toBe("100% 0%");
    expect(formatFocal({ x: 12.6, y: 0 })).toBe("13% 0%");
  });
});
