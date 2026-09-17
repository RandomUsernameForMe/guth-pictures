import { describe, it, expect } from "vitest";
import { CAPSTONES, capstoneExposure, type CapVals, type CapstoneMechanic } from "../components/capstones";
import { computeLight } from "../components/light";
import { DEFAULT_PARAMS } from "../components/types";

const ev = (m: CapstoneMechanic, v: CapVals) =>
  computeLight({ ...DEFAULT_PARAMS, ...v, exposure: capstoneExposure(m) }).evDelta;

describe("capstone scenarios", () => {
  for (const [id, m] of Object.entries(CAPSTONES)) {
    it(`${id}: ref point balances (~0 EV)`, () => {
      expect(Math.abs(ev(m, m.ref))).toBeLessThan(0.05);
    });

    it(`${id}: starts off-balance (>0.3 EV)`, () => {
      expect(Math.abs(ev(m, m.init))).toBeGreaterThan(0.3);
    });

    it(`${id}: a solution exists within the ranges`, () => {
      const { aperture: ra, shutter: rs, iso: ri } = m.ranges;
      let solved = false;
      for (let a = ra.min; a <= ra.max && !solved; a += 0.2)
        for (let s = rs.min; s <= rs.max && !solved; s += 0.02)
          for (let iso = ri.min; iso <= ri.max && !solved; iso += 100)
            if (Math.abs(ev(m, { aperture: a, shutter: s, iso })) < 0.3) solved = true;
      expect(solved).toBe(true);
    });

    it(`${id}: the restricted leg can't fix it alone`, () => {
      const r = m.ranges[m.restricted];
      let canSolo = false;
      for (let x = r.min; x <= r.max + 1e-9; x += (r.max - r.min) / 50) {
        if (Math.abs(ev(m, { ...m.init, [m.restricted]: x })) < 0.3) canSolo = true;
      }
      expect(canSolo).toBe(false);
    });
  }
});
