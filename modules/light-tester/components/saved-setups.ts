import type { SavedSetup } from "./types";

const LS_KEY = "guth-lt-saved";

export function loadSaved(): SavedSetup[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}

export function persistSaved(setups: SavedSetup[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(setups)); } catch {}
}
