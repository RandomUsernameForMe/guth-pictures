import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "./share-state";
import type { Light, Tweaks } from "./types";

const tweaks: Tweaks = { headStyle: "clay", focal: 85, backdrop: "#112233" };
const noId = ({ id: _id, ...rest }: Light) => rest;

const key: Light = {
  id: "a", type: "key", x: 1.4, z: -0.4, height: 2.1, power: 80, kelvin: 5500,
  gel: "warm", size: 45, on: true, aim: { x: 0.2, z: 0.3, y: 1.55 },
};
const fill: Light = { ...key, id: "b", type: "fill", on: false, aim: null };
const sun: Light = {
  id: "c", type: "sun", x: 0, z: 0, height: 0, power: 75, kelvin: 5600,
  gel: "none", size: 50, on: true, aim: null, azimuth: 123.456, elevation: 42.04,
};

describe("share-state codec", () => {
  it("round-trips lights, tweaks and presetId (ids regenerate)", () => {
    const out = decodeState(encodeState([key, fill], tweaks, "rembrandt"));
    expect(out).not.toBeNull();
    expect(out!.lights.map(noId)).toEqual([key, fill].map(noId));
    expect(out!.tweaks).toEqual(tweaks);
    expect(out!.presetId).toBe("rembrandt");
  });

  it("keeps null presetId", () => {
    expect(decodeState(encodeState([key], tweaks, null))!.presetId).toBeNull();
  });

  it("keeps sun azimuth/elevation rounded to 1 decimal", () => {
    const [L] = decodeState(encodeState([sun], tweaks, null))!.lights;
    expect(L).toMatchObject({ type: "sun", x: 0, z: 0, height: 0, azimuth: 123.5, elevation: 42 });
  });

  it("rejects version other than 1", () => {
    const hash = btoa(JSON.stringify({ v: 2, p: null, l: [], t: ["clay", 50, "#000"] }));
    expect(decodeState(hash)).toBeNull();
  });

  it("rejects garbage input", () => {
    expect(decodeState("%%%not-base64")).toBeNull();
    expect(decodeState(btoa("not json"))).toBeNull();
  });
});
