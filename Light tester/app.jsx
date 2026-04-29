/* global React, ReactDOM */
/* Main Light Tester app — orchestrates state, scene, floor, inspector */

(function () {
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  let _id = 0;
  const newId = () => `L${++_id}_${Math.random().toString(36).slice(2, 6)}`;

  function clonePreset(preset) {
    return preset.lights.map(L => ({ ...L, id: newId() }));
  }

  // URL state
  function encodeState(lights, tweaks, presetId) {
    const compact = {
      v: 1,
      p: presetId,
      l: lights.map(L => [L.type, +L.x.toFixed(2), +L.z.toFixed(2), +L.height.toFixed(2), Math.round(L.power), L.kelvin, L.gel, Math.round(L.size || 50), L.on === false ? 0 : 1, L.aim ? [+L.aim.x.toFixed(2), +L.aim.z.toFixed(2)] : 0]),
      t: [tweaks.headStyle, tweaks.focal, tweaks.backdrop],
    };
    try { return btoa(JSON.stringify(compact)); } catch { return ''; }
  }

  function decodeState(hash) {
    try {
      const j = JSON.parse(atob(hash));
      if (j.v !== 1) return null;
      const lights = j.l.map(([type, x, z, height, power, kelvin, gel, size, on, aim]) => ({
        id: newId(), type, x, z, height, power, kelvin, gel, size, on: !!on,
        aim: Array.isArray(aim) ? { x: aim[0], z: aim[1], y: 1.55 } : null,
      }));
      const tweaks = { headStyle: j.t[0], focal: j.t[1], backdrop: j.t[2] };
      return { lights, tweaks, presetId: j.p };
    } catch { return null; }
  }

  function App() {
    // ── Tweaks (host-persisted defaults) ─────────────────────────────
    const tweakDefaults = /*EDITMODE-BEGIN*/{
      "headStyle": "clay",
      "focal": 50,
      "backdrop": "#3A3A3F",
      "showCones": true,
      "language": "cs"
    }/*EDITMODE-END*/;

    const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(tweakDefaults) : [tweakDefaults, () => {}];

    // ── Lights state ─────────────────────────────────────────────────
    const [lights, setLights] = useState(() => clonePreset(window.PRESETS[0]));
    const [selectedId, setSelectedId] = useState(null);
    const [activePresetId, setActivePresetId] = useState('rembrandt');
    const [shareCopied, setShareCopied] = useState(false);

    // Initial: load from hash if present
    useEffect(() => {
      if (window.location.hash.length > 1) {
        const decoded = decodeState(window.location.hash.slice(1));
        if (decoded) {
          setLights(decoded.lights);
          setActivePresetId(decoded.presetId || null);
          setSelectedId(decoded.lights[0]?.id || null);
        }
      } else {
        setSelectedId(s => s || (prev => prev)(lights[0]?.id));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (!selectedId && lights[0]) setSelectedId(lights[0].id);
    }, [lights, selectedId]);

    // ── Mutations ────────────────────────────────────────────────────
    const updateLight = useCallback((id, patch) => {
      setLights(prev => prev.map(L => L.id === id ? { ...L, ...patch } : L));
      setActivePresetId(null);
    }, []);

    const moveLight = useCallback((id, pos) => {
      setLights(prev => prev.map(L => L.id === id ? { ...L, ...pos } : L));
      setActivePresetId(null);
    }, []);

    const removeLight = useCallback((id) => {
      setLights(prev => prev.filter(L => L.id !== id));
      setSelectedId(prev => prev === id ? null : prev);
      setActivePresetId(null);
    }, []);

    const addType = useCallback((type) => {
      const defaults = {
        key:     { x:  1.4, z: -0.4, height: 2.1, power: 80, kelvin: 5500, gel: 'none', size: 45, on: true },
        fill:    { x: -1.2, z:  0.6, height: 1.7, power: 35, kelvin: 5500, gel: 'none', size: 70, on: true },
        rim:     { x: -1.5, z: -1.4, height: 2.1, power: 60, kelvin: 6500, gel: 'none', size: 30, on: true },
        beauty:  { x:  0.0, z:  1.0, height: 2.3, power: 80, kelvin: 5500, gel: 'none', size: 55, on: true },
        softbox: { x:  1.4, z:  0.6, height: 2.0, power: 70, kelvin: 5500, gel: 'none', size: 75, on: true },
      };
      const newLight = { id: newId(), type, ...(defaults[type] || defaults.key) };
      setLights(prev => [...prev, newLight]);
      setSelectedId(newLight.id);
      setActivePresetId(null);
    }, []);

    const applyPreset = useCallback((preset) => {
      const ls = clonePreset(preset);
      setLights(ls);
      setSelectedId(ls[0]?.id || null);
      setActivePresetId(preset.id);
    }, []);

    const reset = useCallback(() => {
      applyPreset(window.PRESETS[0]);
    }, [applyPreset]);

    // ── Share ────────────────────────────────────────────────────────
    const share = useCallback(() => {
      const hash = encodeState(lights, tweaks, activePresetId);
      const url = `${location.origin}${location.pathname}#${hash}`;
      try {
        navigator.clipboard.writeText(url);
      } catch {}
      window.history.replaceState(null, '', `#${hash}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    }, [lights, tweaks, activePresetId]);

    // Keep hash live but don't spam history
    useEffect(() => {
      const t = setTimeout(() => {
        const hash = encodeState(lights, tweaks, activePresetId);
        if (hash) window.history.replaceState(null, '', `#${hash}`);
      }, 400);
      return () => clearTimeout(t);
    }, [lights, tweaks, activePresetId]);

    // ── Preview render — uses CameraScene ────────────────────────────
    return (
      <div className="app">
        {/* Top nav */}
        <header className="topbar">
          <div className="brand">
            <span className="wm">GUTH</span>
            <span className="dot">·</span>
            <span className="prod">LIGHT TESTER</span>
          </div>
          <div className="topmeta">
            <span className="lbl">Setup</span>
            <span className="val">{activePresetId ? window.PRESETS.find(p => p.id === activePresetId)?.name : 'Custom'}</span>
            <span className="lbl" style={{ marginLeft: 16 }}>{lights.length} sv.</span>
          </div>
          <div className="topactions">
            <button className="btn ghost" onClick={reset}>Reset</button>
            <button className="btn primary" onClick={share}>
              {shareCopied ? '✓ Zkopírováno' : 'Sdílet ↗'}
            </button>
          </div>
        </header>

        <div className="layout">
          {/* Left: Studio floor */}
          <main className="stage">
            <div className="floor-wrap">
              <window.StudioFloor
                lights={lights}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={moveLight}
                onUpdate={updateLight}
                onAdd={addType}
              />

              {/* Live camera preview corner */}
              <div className="preview">
                <div className="pl">
                  <span>Live · kamera</span>
                  <span>{tweaks.focal}mm · f/2.8</span>
                </div>
                <window.CameraScene
                  lights={lights}
                  tweaks={tweaks}
                  selectedId={selectedId}
                  onSelectLight={setSelectedId}
                />
              </div>
            </div>
          </main>

          {/* Right: Inspector */}
          <aside className="aside">
            <window.Inspector
              lights={lights}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={updateLight}
              onRemove={removeLight}
              onAddType={addType}
              onApplyPreset={applyPreset}
              activePresetId={activePresetId}
            />
          </aside>
        </div>

        {/* Tweaks panel */}
        {window.TweaksPanel && (
          <window.TweaksPanel>
            <window.TweakSection label="3D model" />
            <window.TweakRadio
              label="Styl hlavy"
              value={tweaks.headStyle}
              options={[
                { value: 'clay', label: 'Clay' },
                { value: 'realistic', label: 'Real' },
                { value: 'wireframe', label: 'Wire' },
              ]}
              onChange={v => setTweak('headStyle', v)}
            />

            <window.TweakSection label="Kamera" />
            <window.TweakSlider
              label="Ohnisko"
              value={tweaks.focal}
              min={24} max={135} step={1}
              unit=" mm"
              onChange={v => setTweak('focal', v)}
            />

            <window.TweakSection label="Pozadí" />
            <window.TweakSelect
              label="Backdrop"
              value={tweaks.backdrop}
              options={[
                { value: '#0A0A0B', label: 'Black' },
                { value: '#3A3A3F', label: 'Slate' },
                { value: '#6B5A4A', label: 'Sienna' },
                { value: '#A89888', label: 'Sand' },
                { value: '#F2F0EB', label: 'Cream' },
              ]}
              onChange={v => setTweak('backdrop', v)}
            />
          </window.TweaksPanel>
        )}
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(App));
})();
