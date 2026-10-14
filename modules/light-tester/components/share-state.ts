import type { Light, Tweaks } from "./types";
import type { PRESETS } from "./types";

let _id = 0;
export const newId = () => `L${++_id}_${Math.random().toString(36).slice(2, 6)}`;

export function clonePreset(preset: typeof PRESETS[0]): Light[] {
  return preset.lights.map((L) => ({ ...L, id: newId() }));
}

export function encodeState(lights: Light[], tweaks: Tweaks, presetId: string | null): string {
  const compact = {
    v: 1,
    p: presetId,
    l: lights.map((L) => [
      L.type,
      L.type === "sun" ? +(L.azimuth ?? 45).toFixed(1) : +L.x.toFixed(2),
      L.type === "sun" ? +(L.elevation ?? 45).toFixed(1) : +L.z.toFixed(2),
      L.type === "sun" ? 0 : +L.height.toFixed(2),
      Math.round(L.power), L.kelvin, L.gel, Math.round(L.size || 50),
      L.on ? 1 : 0,
      L.aim ? [+L.aim.x.toFixed(2), +L.aim.z.toFixed(2)] : 0,
    ]),
    t: [tweaks.headStyle, tweaks.focal, tweaks.backdrop],
  };
  try { return btoa(JSON.stringify(compact)); } catch { return ""; }
}

export function decodeState(hash: string): { lights: Light[]; tweaks: Tweaks; presetId: string | null } | null {
  try {
    const j = JSON.parse(atob(hash));
    if (j.v !== 1) return null;
    const lights: Light[] = j.l.map(
      ([type, x, z, height, power, kelvin, gel, size, on, aim]: [string, number, number, number, number, number, string, number, number, number[] | 0]) => {
        const base = { id: newId(), type, power, kelvin, gel, size, on: !!on, aim: Array.isArray(aim) ? { x: aim[0], z: aim[1], y: 1.55 } : null };
        if (type === "sun") return { ...base, x: 0, z: 0, height: 0, azimuth: x, elevation: z };
        return { ...base, x, z, height };
      }
    );
    const tweaks: Tweaks = { headStyle: j.t[0], focal: j.t[1], backdrop: j.t[2] };
    return { lights, tweaks, presetId: j.p ?? null };
  } catch { return null; }
}

export function remapLightIds(lights: Light[]): Light[] {
  let n = 0;
  return lights.map((L) => ({ ...L, id: `L${++n}_${Math.random().toString(36).slice(2, 6)}` }));
}
