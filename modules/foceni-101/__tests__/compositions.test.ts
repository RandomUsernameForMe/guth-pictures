import { describe, it, expect } from "vitest";
import {
  COMPOSITIONS,
  ORB_COUNT,
  ORB_LAYOUTS,
  goldenSpiralPoints,
  type OverlayKind,
} from "../components/compositions";

const KINDS: OverlayKind[] = ["thirds", "center", "golden", "leading", "space", "frame"];

describe("COMPOSITIONS", () => {
  it("placement in [-1,1] and framing >= 1", () => {
    for (const c of COMPOSITIONS) {
      expect(c.comp).toBeGreaterThanOrEqual(-1);
      expect(c.comp).toBeLessThanOrEqual(1);
      expect(c.compY).toBeGreaterThanOrEqual(-1);
      expect(c.compY).toBeLessThanOrEqual(1);
      expect(c.framing).toBeGreaterThanOrEqual(1);
    }
  });
  it("each overlay is a known kind", () => {
    for (const c of COMPOSITIONS) expect(KINDS).toContain(c.overlay);
  });
  it("has the six expected compositions", () => {
    expect(COMPOSITIONS.map((c) => c.id)).toEqual([
      "thirds", "center", "golden", "leading", "space", "frame",
    ]);
  });
  it("every composition has its own orb layout", () => {
    for (const c of COMPOSITIONS) expect(ORB_LAYOUTS[c.id]).toBeDefined();
  });
  it("no two compositions produce the same scene", () => {
    // The old bug: `leading` and `center` were identical except for an SVG overlay.
    const keys = COMPOSITIONS.map(
      (c) => `${c.comp},${c.compY},${c.framing},${JSON.stringify(ORB_LAYOUTS[c.id])}`,
    );
    expect(new Set(keys).size).toBe(COMPOSITIONS.length);
  });
});

describe("ORB_LAYOUTS", () => {
  it("every layout has exactly ORB_COUNT orbs, all on screen", () => {
    for (const [id, layout] of Object.entries(ORB_LAYOUTS)) {
      expect(layout, id).toHaveLength(ORB_COUNT);
      for (const o of layout) {
        // Parked orbs (s = 0) are allowed anywhere; visible ones must be in frame.
        if (o.s <= 0.02) continue;
        expect(Math.abs(o.u), `${id} u`).toBeLessThanOrEqual(1.1);
        expect(Math.abs(o.v), `${id} v`).toBeLessThanOrEqual(1.1);
        expect(o.z, `${id} z`).toBeGreaterThan(-1.5); // never behind the camera
      }
    }
  });
  it("golden spiral radius grows by phi^2 every half turn", () => {
    const g = ORB_LAYOUTS.golden;
    const r = (o: (typeof g)[number]) => Math.hypot(o.u - 0.236, o.v - 0.236);
    // Monotonically expanding — that is what makes it a spiral, not a ring.
    for (let i = 1; i < g.length; i++) expect(r(g[i])).toBeGreaterThan(r(g[i - 1]));
    // Ball size tracks the spiral radius, so the coil reads as depth.
    for (let i = 1; i < g.length; i++) expect(g[i].s).toBeGreaterThan(g[i - 1].s);
  });
  it("leading lines converge toward the subject as they recede", () => {
    const l = ORB_LAYOUTS.leading;
    const near = l.filter((o) => o.z < 0);
    const far = l.filter((o) => o.z > 1);
    const spread = (xs: typeof l) => Math.max(...xs.map((o) => Math.abs(o.u)));
    expect(spread(far)).toBeLessThan(spread(near));
  });
  it("center is left-right symmetric", () => {
    const us = ORB_LAYOUTS.center.map((o) => o.u).sort((a, b) => a - b);
    const flipped = us.map((u) => -u).sort((a, b) => a - b);
    us.forEach((u, i) => expect(u).toBeCloseTo(flipped[i], 6));
  });
});

describe("subject placement", () => {
  const at = (id: string) => COMPOSITIONS.find((c) => c.id === id)!;
  it("thirds marks the thirds intersection, golden marks the phi one", () => {
    expect(at("thirds").markX).toBeCloseTo(2 / 3, 3);
    expect(at("thirds").markY).toBeCloseTo(1 / 3, 3);
    expect(at("golden").markX).toBeCloseTo(0.618, 3);
    expect(at("golden").markY).toBeCloseTo(0.382, 3);
  });
  it("comp is the mark mapped to -1..1", () => {
    for (const c of COMPOSITIONS) expect(c.comp).toBeCloseTo((c.markX - 0.5) * 2, 6);
  });
  it("the subject is dropped below the mark so its eyes land on it", () => {
    // The model's origin is mid-chest; without this the grid crosses the collarbone.
    for (const c of COMPOSITIONS) expect(c.compY).toBeLessThan((0.5 - c.markY) * 2);
  });
  it("every mark stays inside the frame", () => {
    for (const c of COMPOSITIONS) {
      expect(c.markX).toBeGreaterThan(0);
      expect(c.markX).toBeLessThan(1);
      expect(c.markY).toBeGreaterThan(0);
      expect(c.markY).toBeLessThan(1);
    }
  });
});

describe("goldenSpiralPoints", () => {
  it("returns a polyline that stays inside the frame", () => {
    const pts = goldenSpiralPoints(40).split(" ").map((p) => p.split(",").map(Number));
    expect(pts).toHaveLength(41);
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(-5);
      expect(x).toBeLessThanOrEqual(105);
      expect(y).toBeGreaterThanOrEqual(-5);
      expect(y).toBeLessThanOrEqual(105);
    }
  });
});
