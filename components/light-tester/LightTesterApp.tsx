"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { StudioFloor } from "./StudioFloor";
import { Inspector } from "./Inspector";
import type { Light, LightType, Tweaks, SavedSetup } from "./types";
import { PRESETS } from "./types";

const LS_KEY = "guth-lt-saved";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function shouldShowSupport() {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem("lt_supported")) return false;
  const snoozed = localStorage.getItem("lt_snoozed");
  if (snoozed && Date.now() - Number(snoozed) < SNOOZE_MS) return false;
  return true;
}

function SupportToast({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const hide = (cb: () => void) => {
    setVisible(false);
    setTimeout(cb, 320);
  };

  const openBMC = () => {
    window.open("https://buymeacoffee.com/guth", "bmc", "width=500,height=650,scrollbars=yes");
    localStorage.setItem("lt_supported", "1");
    hide(onDismiss);
  };

  const snooze = () => {
    localStorage.setItem("lt_snoozed", String(Date.now()));
    hide(onDismiss);
  };

  return (
    <div className={`lt-support-toast${visible ? " lt-support-toast--in" : ""}`}>
      <p className="lt-support-text">
        Light Tester je zdarma a vždy bude. Stál ale čas a zkušenosti —
        pokud ti pomohl, budu rád za příspěvek.
      </p>
      <div className="lt-support-actions">
        <button className="lt-btn lt-btn-primary" onClick={openBMC}>☕ Přispět</button>
        <button className="lt-btn lt-btn-ghost" onClick={snooze}>Příště</button>
      </div>
    </div>
  );
}

function loadSaved(): SavedSetup[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}

function persistSaved(setups: SavedSetup[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(setups)); } catch {}
}

const CameraScene = dynamic(
  () => import("./CameraScene").then((m) => ({ default: m.CameraScene })),
  { ssr: false }
);

let _id = 0;
const newId = () => `L${++_id}_${Math.random().toString(36).slice(2, 6)}`;

function clonePreset(preset: typeof PRESETS[0]): Light[] {
  return preset.lights.map((L) => ({ ...L, id: newId() }));
}

function encodeState(lights: Light[], tweaks: Tweaks, presetId: string | null): string {
  const compact = {
    v: 1,
    p: presetId,
    l: lights.map((L) => [
      L.type, +L.x.toFixed(2), +L.z.toFixed(2), +L.height.toFixed(2),
      Math.round(L.power), L.kelvin, L.gel, Math.round(L.size || 50),
      L.on ? 1 : 0,
      L.aim ? [+L.aim.x.toFixed(2), +L.aim.z.toFixed(2)] : 0,
    ]),
    t: [tweaks.headStyle, tweaks.focal, tweaks.backdrop],
  };
  try { return btoa(JSON.stringify(compact)); } catch { return ""; }
}

function decodeState(hash: string): { lights: Light[]; tweaks: Tweaks; presetId: string | null } | null {
  try {
    const j = JSON.parse(atob(hash));
    if (j.v !== 1) return null;
    const lights: Light[] = j.l.map(
      ([type, x, z, height, power, kelvin, gel, size, on, aim]: [string, number, number, number, number, number, string, number, number, number[] | 0]) => ({
        id: newId(), type, x, z, height, power, kelvin, gel, size, on: !!on,
        aim: Array.isArray(aim) ? { x: aim[0], z: aim[1], y: 1.55 } : null,
      })
    );
    const tweaks: Tweaks = { headStyle: j.t[0], focal: j.t[1], backdrop: j.t[2] };
    return { lights, tweaks, presetId: j.p ?? null };
  } catch { return null; }
}

export function LightTesterApp() {
  const [lights, setLights] = useState<Light[]>(() => clonePreset(PRESETS[0]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>("rembrandt");
  const [shareCopied, setShareCopied] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const [cameraPos, setCameraPos] = useState({ x: 0, z: 1.6 });
  const [savedSetups, setSavedSetups] = useState<SavedSetup[]>(() => loadSaved());
  const [tweaks, setTweaks] = useState<Tweaks>({
    headStyle: "realistic",
    focal: 50,
    backdrop: "#3A3A3F",
  });

  useEffect(() => {
    if (window.location.hash.length > 1) {
      const decoded = decodeState(window.location.hash.slice(1));
      if (decoded) {
        setLights(decoded.lights);
        setTweaks(decoded.tweaks);
        setActivePresetId(decoded.presetId);
        setSelectedId(decoded.lights[0]?.id ?? null);
        return;
      }
    }
    setSelectedId(lights[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId && lights[0]) setSelectedId(lights[0].id);
  }, [lights, selectedId]);

  useEffect(() => {
    const t = setTimeout(() => {
      const hash = encodeState(lights, tweaks, activePresetId);
      if (hash) window.history.replaceState(null, "", `#${hash}`);
    }, 400);
    return () => clearTimeout(t);
  }, [lights, tweaks, activePresetId]);

  const updateLight = useCallback((id: string, patch: Partial<Light>) => {
    setLights((prev) => prev.map((L) => L.id === id ? { ...L, ...patch } : L));
    setActivePresetId(null);
  }, []);

  const moveLight = useCallback((id: string, pos: { x: number; z: number }) => {
    setLights((prev) => prev.map((L) => L.id === id ? { ...L, ...pos } : L));
    setActivePresetId(null);
  }, []);

  const removeLight = useCallback((id: string) => {
    setLights((prev) => prev.filter((L) => L.id !== id));
    setSelectedId((prev) => prev === id ? null : prev);
    setActivePresetId(null);
  }, []);

  const addType = useCallback((type: LightType) => {
    const defaults: Record<LightType, Omit<Light, "id" | "type">> = {
      key:     { x:  1.4, z: -0.4, height: 2.1, power: 80, kelvin: 5500, gel: "none", size: 45, on: true, aim: null },
      fill:    { x: -1.2, z:  0.6, height: 1.7, power: 35, kelvin: 5500, gel: "none", size: 70, on: true, aim: null },
      rim:     { x: -1.5, z: -1.4, height: 2.1, power: 60, kelvin: 6500, gel: "none", size: 30, on: true, aim: null },
      beauty:  { x:  0.0, z:  1.0, height: 2.3, power: 80, kelvin: 5500, gel: "none", size: 55, on: true, aim: null },
      softbox: { x:  1.4, z:  0.6, height: 2.0, power: 70, kelvin: 5500, gel: "none", size: 75, on: true, aim: null },
    };
    const newLight: Light = { id: newId(), type, ...defaults[type] };
    setLights((prev) => [...prev, newLight]);
    setSelectedId(newLight.id);
    setActivePresetId(null);
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    const ls = clonePreset(preset);
    setLights(ls);
    setSelectedId(ls[0]?.id ?? null);
    setActivePresetId(preset.id);
  }, []);

  const reset = useCallback(() => applyPreset(PRESETS[0]), [applyPreset]);

  useEffect(() => {
    const iv = setInterval(() => {
      if (shouldShowSupport() && Date.now() - sessionStartRef.current >= 5 * 60 * 1000) {
        setShowSupport(true);
        clearInterval(iv);
      }
    }, 30_000);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const share = useCallback(() => {
    const hash = encodeState(lights, tweaks, activePresetId);
    const url = `${location.origin}${location.pathname}#${hash}`;
    try { navigator.clipboard.writeText(url); } catch {}
    window.history.replaceState(null, "", `#${hash}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 1800);
    setTimeout(() => { if (shouldShowSupport()) setShowSupport(true); }, 2000);
  }, [lights, tweaks, activePresetId]);

  const setTweak = useCallback(<K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveSetup = useCallback((name: string) => {
    const setup: SavedSetup = {
      id: `s_${Date.now()}`,
      name: name.trim() || "Setup",
      lights: lights.map((L) => ({ ...L })),
      tweaks: { ...tweaks },
      cameraPos: { ...cameraPos },
      savedAt: Date.now(),
    };
    setSavedSetups((prev) => {
      const next = [setup, ...prev];
      persistSaved(next);
      return next;
    });
  }, [lights, tweaks, cameraPos]);

  const deleteSaved = useCallback((id: string) => {
    setSavedSetups((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persistSaved(next);
      return next;
    });
  }, []);

  const loadSavedSetup = useCallback((setup: SavedSetup) => {
    let _id2 = 0;
    const remap = (L: Light): Light => ({ ...L, id: `L${++_id2}_${Math.random().toString(36).slice(2, 6)}` });
    const ls = setup.lights.map(remap);
    setLights(ls);
    setTweaks(setup.tweaks);
    setCameraPos(setup.cameraPos);
    setSelectedId(ls[0]?.id ?? null);
    setActivePresetId(null);
  }, []);

  const presetName = useMemo(() => {
    if (!activePresetId) return "Custom";
    return PRESETS.find((p) => p.id === activePresetId)?.name ?? "Custom";
  }, [activePresetId]);

  return (
    <div className="lt-app">
      {/* Toolbar */}
      <header className="lt-topbar">
        <div className="lt-topmeta">
          <span className="lt-lbl">Setup</span>
          <span className="lt-val">{presetName}</span>
          <span className="lt-lbl" style={{ marginLeft: 16 }}>{lights.length} sv.</span>
        </div>
        <div className="lt-actions">
          <button className="lt-btn lt-btn-ghost" onClick={reset}>Reset</button>
          <button className="lt-btn lt-btn-primary" onClick={share}>
            {shareCopied ? "✓ Zkopírováno" : "Sdílet ↗"}
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="lt-layout">
        <main className="lt-stage">
          <div className="lt-floor-wrap">
            <StudioFloor
              lights={lights}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={moveLight}
              onUpdate={updateLight}
              onAdd={addType}
              cameraPos={cameraPos}
              onMoveCamera={setCameraPos}
            />

            {/* Camera preview corner */}
            <div className="lt-preview">
              <div className="lt-preview-label">
                <span>Live · kamera</span>
                <span>{tweaks.focal}mm · f/2.8</span>
              </div>
              <CameraScene
                lights={lights}
                tweaks={tweaks}
                selectedId={selectedId}
                cameraPos={cameraPos}
              />
            </div>
          </div>
        </main>

        <aside className="lt-aside">
          <Inspector
            lights={lights}
            selectedId={selectedId}
            activePresetId={activePresetId}
            tweaks={tweaks}
            savedSetups={savedSetups}
            onSelect={setSelectedId}
            onUpdate={updateLight}
            onRemove={removeLight}
            onAddType={addType}
            onApplyPreset={applyPreset}
            onTweak={setTweak}
            onSaveSetup={saveSetup}
            onDeleteSaved={deleteSaved}
            onLoadSaved={loadSavedSetup}
          />
        </aside>
      </div>
      {showSupport && <SupportToast onDismiss={() => setShowSupport(false)} />}
    </div>
  );
}
