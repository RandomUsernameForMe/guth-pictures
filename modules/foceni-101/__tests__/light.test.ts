import { describe, it, expect } from "vitest";
import { computeLight, apertureMul, holdExposureFor } from "../components/light";
import { DEFAULT_PARAMS, type PhotoParams } from "../components/types";

const P = (over: Partial<PhotoParams> = {}): PhotoParams => ({ ...DEFAULT_PARAMS, ...over });

describe("computeLight", () => {
  it("default params are correctly exposed (evDelta ≈ 0)", () => {
    expect(computeLight(DEFAULT_PARAMS).evDelta).toBeCloseTo(0, 6);
  });

  it("wider aperture (lower f) is brighter", () => {
    expect(computeLight(P({ aperture: 1.4 })).mul).toBeGreaterThan(
      computeLight(P({ aperture: 5.6 })).mul,
    );
  });

  it("longer shutter is brighter", () => {
    expect(computeLight(P({ shutter: 0.8 })).mul).toBeGreaterThan(
      computeLight(P({ shutter: 0 })).mul,
    );
  });

  it("higher ISO is brighter", () => {
    expect(computeLight(P({ iso: 6400 })).mul).toBeGreaterThan(
      computeLight(P({ iso: 100 })).mul,
    );
  });

  it("apertureMul = 1 at the reference f-stop", () => {
    expect(apertureMul(5.6)).toBeCloseTo(1, 6);
  });
});

describe("holdExposureFor", () => {
  it("cancels aperture/shutter/ISO so net light stays correct", () => {
    const base = P({ aperture: 1.4, shutter: 0.5, iso: 1600 });
    base.exposure = holdExposureFor(base);
    expect(computeLight(base).mul).toBeCloseTo(1, 6);
  });
});
