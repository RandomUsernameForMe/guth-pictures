import { describe, it, expect } from "vitest";
import { COMPOSITIONS, subjectScreenX, type OverlayKind } from "../components/compositions";

const KINDS: OverlayKind[] = ["thirds", "center", "golden", "leading", "space"];

describe("COMPOSITIONS", () => {
  it("comp in [-1,1] and framing >= 1", () => {
    for (const c of COMPOSITIONS) {
      expect(c.comp).toBeGreaterThanOrEqual(-1);
      expect(c.comp).toBeLessThanOrEqual(1);
      expect(c.framing).toBeGreaterThanOrEqual(1);
    }
  });
  it("each overlay is a known kind", () => {
    for (const c of COMPOSITIONS) expect(KINDS).toContain(c.overlay);
  });
  it("has the five expected compositions", () => {
    expect(COMPOSITIONS.map((c) => c.id)).toEqual([
      "thirds", "center", "golden", "leading", "space",
    ]);
  });
});

describe("subjectScreenX", () => {
  it("centre maps to ~0.5", () => expect(subjectScreenX(0)).toBeCloseTo(0.5, 6));
  it("positive comp moves right", () => expect(subjectScreenX(0.5)).toBeGreaterThan(0.5));
  it("clamps to [0,1]", () => {
    expect(subjectScreenX(-5)).toBe(0);
    expect(subjectScreenX(5)).toBe(1);
  });
});
