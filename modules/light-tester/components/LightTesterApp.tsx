"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { track } from "@vercel/analytics";
import dynamic from "next/dynamic";
import { StudioFloor } from "./StudioFloor";
import { Inspector } from "./Inspector";
import type { Light, LightType, Tweaks, SavedSetup } from "./types";
import { PRESETS } from "./types";
import { FeedbackModal } from "./FeedbackModal";
import { SupportToast, shouldShowSupport } from "./SupportToast";
import { encodeState, decodeState, newId, clonePreset, remapLightIds } from "./share-state";
import { loadSaved, persistSaved } from "./saved-setups";

const CameraScene = dynamic(
  () => import("./CameraScene").then((m) => ({ default: m.CameraScene })),
  { ssr: false }
);

export function LightTesterApp() {
  const [lights, setLights] = useState<Light[]>(() => clonePreset(PRESETS[0]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>("rembrandt");
  const [shareCopied, setShareCopied] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    track("lt_open");
    const start = Date.now();
    return () => {
      track("lt_close", { duration_sec: Math.round((Date.now() - start) / 1000) });
    };
  }, []);
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
      sun:     { x:  0.0, z:  0.0, height: 0.0, power: 75, kelvin: 5600, gel: "none", size: 0,  on: true, aim: null, azimuth: 45, elevation: 42 },
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
    const ls = remapLightIds(setup.lights);
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
          <button className="lt-btn lt-btn-ghost" onClick={() => setShowFeedback(true)}>Feedback</button>
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
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
