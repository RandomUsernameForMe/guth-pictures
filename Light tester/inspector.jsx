/* global React */
/* Inspector — right-side panel: presets + selected light controls + active list */

(function () {
  const { useMemo } = React;

  const PRESETS = [
    {
      id: 'rembrandt',
      name: 'Rembrandt',
      desc: '3-light · classic',
      lights: [
        { type: 'key',  x:  1.6, z: -0.6, height: 2.2, power: 85, kelvin: 5400, gel: '#FFE6C8', size: 45, on: true },
        { type: 'fill', x: -1.2, z:  0.8, height: 1.7, power: 35, kelvin: 5600, gel: 'none',    size: 70, on: true },
        { type: 'rim',  x: -1.4, z: -1.4, height: 2.1, power: 65, kelvin: 6500, gel: 'none',    size: 30, on: true },
      ],
    },
    {
      id: 'butterfly',
      name: 'Butterfly',
      desc: 'Beauty · symmetric',
      lights: [
        { type: 'beauty', x: 0,    z:  1.2, height: 2.4, power: 90, kelvin: 5500, gel: 'none', size: 55, on: true },
        { type: 'fill',   x: 0,    z:  0.8, height: 0.8, power: 40, kelvin: 5500, gel: 'none', size: 80, on: true },
      ],
    },
    {
      id: 'split',
      name: 'Split',
      desc: 'Side · dramatic',
      lights: [
        { type: 'key', x: 2.2, z: 0, height: 1.7, power: 95, kelvin: 5200, gel: 'none', size: 35, on: true },
      ],
    },
    {
      id: 'loop',
      name: 'Loop',
      desc: 'Soft · flattering',
      lights: [
        { type: 'softbox', x:  1.4, z:  0.6, height: 2.0, power: 80, kelvin: 5500, gel: '#FFE6C8', size: 75, on: true },
        { type: 'fill',    x: -1.2, z:  0.6, height: 1.7, power: 30, kelvin: 5500, gel: 'none',    size: 70, on: true },
      ],
    },
    {
      id: 'hollywood',
      name: 'Hollywood',
      desc: 'Key + rim · glamour',
      lights: [
        { type: 'key', x:  1.6, z:  0.5, height: 2.2, power: 80, kelvin: 5400, gel: 'none', size: 35, on: true },
        { type: 'rim', x: -1.6, z: -1.2, height: 2.4, power: 80, kelvin: 6500, gel: 'none', size: 25, on: true },
        { type: 'rim', x:  1.6, z: -1.2, height: 2.4, power: 80, kelvin: 6500, gel: 'none', size: 25, on: true },
      ],
    },
  ];

  const GEL_SWATCHES = [
    { id: 'none',    label: 'None',  hex: 'none',    css: '#F2F0EB' },
    { id: 'warm',    label: 'CTO',   hex: '#FFB870', css: '#FFB870' },
    { id: 'cream',   label: 'Cream', hex: '#FFE6C8', css: '#FFE6C8' },
    { id: 'cool',    label: 'CTB',   hex: '#7AB4DC', css: '#7AB4DC' },
    { id: 'magenta', label: 'Mag',   hex: '#DC6EC8', css: '#DC6EC8' },
    { id: 'green',   label: 'Plus',  hex: '#7CDC9A', css: '#7CDC9A' },
  ];

  function Slider({ label, value, min, max, step, fmt, onChange }) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div className="ctrl">
        <div className="row">
          <span>{label}</span>
          <span className="v">{fmt ? fmt(value) : value}</span>
        </div>
        <input
          type="range"
          min={min} max={max} step={step ?? 1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ '--p': `${pct}%` }}
          className="gp-slider"
        />
      </div>
    );
  }

  function Inspector({ lights, selectedId, onSelect, onUpdate, onRemove, onAddType, onApplyPreset, activePresetId }) {
    const sel = useMemo(() => lights.find(l => l.id === selectedId), [lights, selectedId]);

    return (
      <div className="insp">
        {/* PRESETS */}
        <div className="section">
          <div className="section-h">
            <span>Presety</span><span className="num">001</span>
          </div>
          <div className="presets">
            {PRESETS.map(p => (
              <div
                key={p.id}
                className={`preset ${activePresetId === p.id ? 'on' : ''}`}
                onClick={() => onApplyPreset(p)}
              >
                <PresetDiagram preset={p} />
                <div className="info">
                  <div className="n">{p.name}</div>
                  <div className="d">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE LIGHTS */}
        <div className="section">
          <div className="section-h">
            <span>Aktivní · {lights.length}</span><span className="num">002</span>
          </div>
          {lights.map(L => {
            const info = window.TYPE_INFO[L.type];
            return (
              <div
                key={L.id}
                className={`lrow ${L.id === selectedId ? 'on' : ''} ${L.on === false ? 'off' : ''}`}
                onClick={() => onSelect(L.id)}
              >
                <span className="dot" style={{ background: info.color }}></span>
                <span className="nm">{info.label}</span>
                <span className="pw">{Math.round(L.power)}%</span>
                <span
                  className="toggle"
                  data-on={L.on !== false}
                  onClick={(e) => { e.stopPropagation(); onUpdate(L.id, { on: L.on === false }); }}
                  style={{ background: L.on !== false ? info.color : '' }}
                ></span>
              </div>
            );
          })}
          <div className="add-row">
            {['key', 'fill', 'rim', 'beauty', 'softbox'].map(t => {
              const info = window.TYPE_INFO[t];
              return (
                <button key={t} className="chip" onClick={() => onAddType(t)}>
                  <span className="d" style={{ background: info.color }}></span>+ {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTED LIGHT CONTROLS */}
        {sel ? (
          <div className="section">
            <div className="section-h">
              <span>Editace · {window.TYPE_INFO[sel.type].label}</span><span className="num">003</span>
            </div>
            <Slider label="Intenzita" value={sel.power} min={0} max={100} fmt={v => `${Math.round(v)}%`} onChange={v => onUpdate(sel.id, { power: v })} />
            <Slider label="Teplota" value={sel.kelvin} min={2700} max={8000} step={50} fmt={v => `${Math.round(v)} K`} onChange={v => onUpdate(sel.id, { kelvin: v })} />
            <Slider label="Velikost" value={sel.size || 50} min={10} max={100} fmt={v => `${Math.round(v)}`} onChange={v => onUpdate(sel.id, { size: v })} />
            <Slider label="Výška" value={sel.height} min={0.5} max={3.0} step={0.05} fmt={v => `${v.toFixed(2)} m`} onChange={v => onUpdate(sel.id, { height: v })} />
            <div className="ctrl">
              <div className="row">
                <span>Směr</span>
                <span className="v">{sel.aim ? 'Volný' : 'Na subjekt'}</span>
              </div>
              <button
                className="btn ghost"
                style={{ marginTop: 4, fontSize: 11 }}
                onClick={() => onUpdate(sel.id, { aim: sel.aim ? null : { x: 0, z: 0, y: 1.55 } })}
              >
                {sel.aim ? '🔒 Zamknout na subjekt' : '🔓 Odemknout směr'}
              </button>
            </div>
            <div className="ctrl">
              <div className="row">
                <span>Gel · barva</span>
                <span className="v">{(GEL_SWATCHES.find(g => g.hex === sel.gel) || GEL_SWATCHES[0]).label}</span>
              </div>
              <div className="swatches">
                {GEL_SWATCHES.map(g => (
                  <span
                    key={g.id}
                    className={`swatch ${(sel.gel || 'none') === g.hex ? 'on' : ''}`}
                    style={{ background: g.hex === 'none' ? 'transparent' : g.css, borderStyle: g.hex === 'none' ? 'dashed' : 'solid' }}
                    title={g.label}
                    onClick={() => onUpdate(sel.id, { gel: g.hex })}
                  ></span>
                ))}
              </div>
            </div>
            <button className="btn ghost danger" onClick={() => onRemove(sel.id)}>Smazat světlo</button>
          </div>
        ) : (
          <div className="section">
            <div className="empty">Vyber světlo na floor planu pro editaci.</div>
          </div>
        )}
      </div>
    );
  }

  // ── Tiny preset thumb ───────────────────────────────────────────────
  function PresetDiagram({ preset }) {
    return (
      <div className="diag">
        <svg viewBox="-3 -3 6 6" width="36" height="36">
          <circle cx="0" cy="0" r="0.4" fill="rgba(242,240,235,0.30)" stroke="rgba(242,240,235,0.6)" strokeWidth="0.05" strokeDasharray="0.15 0.15" />
          <rect x="-0.3" y="1.4" width="0.6" height="0.4" fill="none" stroke="#C8A96E" strokeWidth="0.08" />
          {preset.lights.map((L, i) => {
            const info = window.TYPE_INFO[L.type];
            return <circle key={i} cx={L.x} cy={L.z} r={L.type === 'softbox' ? 0.4 : 0.28} fill={info.color} opacity="0.85" />;
          })}
        </svg>
      </div>
    );
  }

  Object.assign(window, { Inspector, PRESETS, GEL_SWATCHES });
})();
