"use client";

import { fmtShutter, fmtIso } from "./sections";

export interface CapVals {
  shutter: number;
  iso: number;
}

interface Props {
  num: string;
  title: string;
  body: string;
  vals: CapVals;
  onChange: (v: CapVals) => void;
  solved: boolean;
  active: boolean;
}

const SLIDERS = [
  { key: "shutter" as const, min: 0, max: 1, step: 0.01, label: "Čas závěrky", fmt: fmtShutter },
  { key: "iso" as const, min: 100, max: 6400, step: 100, label: "ISO", fmt: fmtIso },
];

export function Capstone({ num, title, body, vals, onChange, solved, active }: Props) {
  return (
    <div className={`f101-card${active ? " f101-card--active" : ""}`}>
      <div className="f101-card-num">{num}</div>
      <h2 className="f101-card-title">{title}</h2>
      <p className="f101-card-body">{body}</p>

      {SLIDERS.map((c) => {
        const val = vals[c.key];
        const pct = ((val - c.min) / (c.max - c.min)) * 100;
        return (
          <div className="f101-ctrl" key={c.key}>
            <div className="f101-ctrl-row">
              <span>{c.label}</span>
              <span className="f101-ctrl-val">{c.fmt(val)}</span>
            </div>
            <input
              type="range"
              className="gp-slider"
              min={c.min}
              max={c.max}
              step={c.step}
              value={val}
              style={{ ["--p" as string]: `${pct}%` }}
              onChange={(e) => onChange({ ...vals, [c.key]: parseFloat(e.target.value) })}
            />
          </div>
        );
      })}

      <p className={`f101-capstone-win${solved ? " f101-capstone-win--on" : ""}`}>
        Vyměnil jsi jedno za druhé. To je celý ten trojúhelník.
      </p>
    </div>
  );
}
