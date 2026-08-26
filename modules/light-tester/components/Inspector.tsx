"use client";

import { useMemo, useState } from "react";
import type { Light, LightType, Tweaks, SavedSetup } from "./types";
import { TYPE_INFO, GEL_SWATCHES, PRESETS } from "./types";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  fmt?: (v: number) => string;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, step, fmt, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="ctrl">
      <div className="ctrl-row">
        <span>{label}</span>
        <span className="ctrl-val">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step ?? 1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ "--p": `${pct}%` } as React.CSSProperties}
        className="gp-slider"
      />
    </div>
  );
}

function PresetDiagram({ preset }: { preset: typeof PRESETS[0] }) {
  return (
    <div className="preset-diag">
      <svg viewBox="-3 -3 6 6" width="36" height="36">
        <circle cx="0" cy="0" r="0.4" fill="color-mix(in srgb, var(--color-text) 30%, transparent)" stroke="color-mix(in srgb, var(--color-text) 60%, transparent)" strokeWidth="0.05" strokeDasharray="0.15 0.15" />
        <rect x="-0.3" y="1.4" width="0.6" height="0.4" fill="none" stroke="var(--color-accent-secondary)" strokeWidth="0.08" />
        {preset.lights.map((L, i) => {
          const info = TYPE_INFO[L.type];
          return (
            <circle key={i} cx={L.x} cy={L.z} r={L.type === "softbox" ? 0.4 : 0.28} fill={info.color} opacity="0.85" />
          );
        })}
      </svg>
    </div>
  );
}

interface Props {
  lights: Light[];
  selectedId: string | null;
  activePresetId: string | null;
  tweaks: Tweaks;
  savedSetups: SavedSetup[];
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Light>) => void;
  onRemove: (id: string) => void;
  onAddType: (type: LightType) => void;
  onApplyPreset: (preset: typeof PRESETS[0]) => void;
  onTweak: (key: keyof Tweaks, value: Tweaks[keyof Tweaks]) => void;
  onSaveSetup: (name: string) => void;
  onDeleteSaved: (id: string) => void;
  onLoadSaved: (setup: SavedSetup) => void;
}

export function Inspector({
  lights,
  selectedId,
  activePresetId,
  tweaks,
  savedSetups,
  onSelect,
  onUpdate,
  onRemove,
  onAddType,
  onApplyPreset,
  onTweak,
  onSaveSetup,
  onDeleteSaved,
  onLoadSaved,
}: Props) {
  const sel = useMemo(() => lights.find((l) => l.id === selectedId) ?? null, [lights, selectedId]);
  const [saveName, setSaveName] = useState("");

  return (
    <div className="insp">
      {/* PRESETS */}
      <div className="section">
        <div className="section-h">
          <span>Presety</span><span className="section-num">001</span>
        </div>
        <div className="presets-list">
          {PRESETS.map((p) => (
            <div
              key={p.id}
              className={`preset-row ${activePresetId === p.id ? "active" : ""}`}
              onClick={() => onApplyPreset(p)}
            >
              <PresetDiagram preset={p} />
              <div className="preset-info">
                <div className="preset-name">{p.name}</div>
                <div className="preset-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE LIGHTS */}
      <div className="section">
        <div className="section-h">
          <span>Aktivní · {lights.length}</span><span className="section-num">002</span>
        </div>
        {lights.map((L) => {
          const info = TYPE_INFO[L.type];
          return (
            <div
              key={L.id}
              className={`lrow ${L.id === selectedId ? "lrow-active" : ""} ${!L.on ? "lrow-off" : ""}`}
              onClick={() => onSelect(L.id)}
            >
              <span className="lrow-dot" style={{ background: info.color }} />
              <span className="lrow-name">{info.label}</span>
              <span className="lrow-power">{Math.round(L.power)}%</span>
              <span
                className={`lrow-toggle ${L.on ? "lrow-toggle-on" : ""}`}
                style={L.on ? { background: info.color } : undefined}
                onClick={(e) => { e.stopPropagation(); onUpdate(L.id, { on: !L.on }); }}
              />
            </div>
          );
        })}
        <div className="add-row">
          {(["key", "fill", "rim", "beauty", "softbox", "sun"] as LightType[]).map((t) => {
            const info = TYPE_INFO[t];
            return (
              <button key={t} className="chip" onClick={() => onAddType(t)}>
                <span className="chip-dot" style={{ background: info.color }} />
                + {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED LIGHT */}
      {sel ? (
        <div className="section">
          <div className="section-h">
            <span>Editace · {TYPE_INFO[sel.type].label}</span><span className="section-num">003</span>
          </div>
          <Slider label="Intenzita" value={sel.power} min={0} max={100} fmt={(v) => `${Math.round(v)}%`} onChange={(v) => onUpdate(sel.id, { power: v })} />
          <Slider label="Teplota" value={sel.kelvin} min={2700} max={8000} step={50} fmt={(v) => `${Math.round(v)} K`} onChange={(v) => onUpdate(sel.id, { kelvin: v })} />

          {sel.type === "sun" ? (
            <>
              <Slider label="Azimut" value={sel.azimuth ?? 45} min={0} max={360} step={1} fmt={(v) => `${Math.round(v)}°`} onChange={(v) => onUpdate(sel.id, { azimuth: v })} />
              <Slider label="Výška nad horizontem" value={sel.elevation ?? 45} min={0} max={90} step={1} fmt={(v) => `${Math.round(v)}°`} onChange={(v) => onUpdate(sel.id, { elevation: v })} />
              <Slider label="Měkkost" value={sel.size ?? 0} min={0} max={100} step={1} fmt={(v) => v < 15 ? "Hard" : v < 50 ? "Soft" : "Diffuse"} onChange={(v) => onUpdate(sel.id, { size: v })} />
            </>
          ) : (
            <>
              <Slider label="Velikost" value={sel.size || 50} min={10} max={100} fmt={(v) => `${Math.round(v)}`} onChange={(v) => onUpdate(sel.id, { size: v })} />
              <Slider label="Výška" value={sel.height} min={0.5} max={3.0} step={0.05} fmt={(v) => `${v.toFixed(2)} m`} onChange={(v) => onUpdate(sel.id, { height: v })} />
              <div className="ctrl">
                <div className="ctrl-row">
                  <span>Směr</span>
                  <span className="ctrl-val">{sel.aim ? "Volný" : "Na subjekt"}</span>
                </div>
                <button
                  className="btn ghost"
                  style={{ marginTop: 4, fontSize: 11 }}
                  onClick={() => onUpdate(sel.id, { aim: sel.aim ? null : { x: 0, z: 0, y: 1.55 } })}
                >
                  {sel.aim ? "🔒 Zamknout na subjekt" : "🔓 Odemknout směr"}
                </button>
              </div>
            </>
          )}

          <div className="ctrl">
            <div className="ctrl-row">
              <span>Gel · barva</span>
              <span className="ctrl-val">{sel.gel === "none" ? "Bez gelu" : sel.gel}</span>
            </div>
            <div className="gel-row">
              {/* Quick presets */}
              {GEL_SWATCHES.filter((g) => g.id !== "none").map((g) => (
                <span
                  key={g.id}
                  className={`swatch ${sel.gel === g.hex ? "swatch-active" : ""}`}
                  style={{ background: g.css }}
                  title={g.label}
                  onClick={() => onUpdate(sel.id, { gel: g.hex })}
                />
              ))}
              {/* Custom color picker */}
              <label className="gel-picker-wrap" title="Vlastní barva">
                <input
                  type="color"
                  className="gel-picker"
                  value={sel.gel === "none" ? "#ffffff" : sel.gel}
                  onChange={(e) => onUpdate(sel.id, { gel: e.target.value })}
                />
                <span className="gel-picker-icon">+</span>
              </label>
              {/* None */}
              <span
                className={`swatch ${sel.gel === "none" ? "swatch-active" : ""}`}
                style={{ background: "transparent", borderStyle: "dashed" }}
                title="Bez gelu"
                onClick={() => onUpdate(sel.id, { gel: "none" })}
              >
                <span style={{ fontSize: 10, color: "var(--color-text-ghost)", lineHeight: 1 }}>∅</span>
              </span>
            </div>
          </div>

          <button className="btn ghost danger" onClick={() => onRemove(sel.id)}>
            Smazat světlo
          </button>
        </div>
      ) : (
        <div className="section">
          <div className="empty">Vyber světlo na floor planu pro editaci.</div>
        </div>
      )}

      {/* SCENE SETTINGS */}
      <div className="section">
        <div className="section-h">
          <span>Scéna</span><span className="section-num">004</span>
        </div>

        <div className="ctrl">
          <div className="ctrl-row"><span>Model hlavy</span></div>
          <div className="seg-group">
            {(["realistic", "clay"] as const).map((v) => (
              <button
                key={v}
                className={`seg-btn ${tweaks.headStyle === v ? "seg-btn-active" : ""}`}
                onClick={() => onTweak("headStyle", v)}
              >
                {v === "realistic" ? "Real" : "Clay"}
              </button>
            ))}
          </div>
        </div>

        <div className="ctrl">
          <div className="ctrl-row">
            <span>Ohnisko</span>
            <span className="ctrl-val">{tweaks.focal} mm</span>
          </div>
          <input
            type="range" min={14} max={300} step={1}
            value={tweaks.focal}
            onChange={(e) => onTweak("focal", parseInt(e.target.value))}
            style={{ "--p": `${((tweaks.focal - 14) / (300 - 14)) * 100}%` } as React.CSSProperties}
            className="gp-slider"
          />
        </div>

        <div className="ctrl">
          <div className="ctrl-row"><span>Pozadí</span></div>
          <div className="backdrop-swatches">
            {([
              { value: "#0A0A0B", label: "Black" },
              { value: "#3A3A3F", label: "Slate" },
              { value: "#6B5A4A", label: "Sienna" },
              { value: "#A89888", label: "Sand" },
              { value: "#F2F0EB", label: "Cream" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                title={opt.label}
                className={`backdrop-swatch ${tweaks.backdrop === opt.value ? "backdrop-swatch-active" : ""}`}
                style={{ background: opt.value }}
                onClick={() => onTweak("backdrop", opt.value)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* SAVED SETUPS */}
      <div className="section">
        <div className="section-h">
          <span>Uložené</span><span className="section-num">005</span>
        </div>

        {/* Save form */}
        <div className="save-row">
          <input
            className="save-input"
            type="text"
            placeholder="Název setupu…"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && saveName.trim()) {
                onSaveSetup(saveName);
                setSaveName("");
              }
            }}
            maxLength={40}
          />
          <button
            className="lt-btn lt-btn-primary save-btn"
            disabled={!saveName.trim()}
            onClick={() => {
              if (!saveName.trim()) return;
              onSaveSetup(saveName);
              setSaveName("");
            }}
          >
            Uložit
          </button>
        </div>

        {savedSetups.length === 0 ? (
          <div className="empty">Zatím žádné uložené setupy.</div>
        ) : (
          <div className="saved-list">
            {savedSetups.map((s) => (
              <div key={s.id} className="saved-row">
                <button className="saved-load" onClick={() => onLoadSaved(s)}>
                  <span className="saved-name">{s.name}</span>
                  <span className="saved-meta">{s.lights.length} sv. · {new Date(s.savedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}</span>
                </button>
                <button
                  className="saved-delete"
                  title="Smazat"
                  onClick={() => onDeleteSaved(s.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        {tweaks.headStyle === "realistic" && (
          <p className="lt-attribution">
            Model:{" "}
            <a
              href="https://poly.pizza/m/eqJEiOX0Fhl"
              target="_blank"
              rel="noopener noreferrer"
            >
              male_base
            </a>{" "}
            by hedy magroun via Poly Pizza,{" "}
            <a
              href="https://creativecommons.org/licenses/by/3.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY 3.0
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
