"use client";

import { fmtShutter, fmtIso } from "./sections";
import type { CapVals, CapLeg, CapstoneMechanic } from "./capstones";

interface Props {
  num: string;
  title: string;
  body: string;
  scenario: CapstoneMechanic;
  vals: CapVals;
  onChange: (v: CapVals) => void;
  solved: boolean;
  active: boolean;
}

const LEGS: { key: CapLeg; label: string; fmt: (v: number) => string }[] = [
  { key: "aperture", label: "Clona", fmt: (v) => `f/${v.toFixed(1)}` },
  { key: "shutter", label: "Čas závěrky", fmt: fmtShutter },
  { key: "iso", label: "ISO", fmt: fmtIso },
];

export function Capstone({ num, title, body, scenario, vals, onChange, solved, active }: Props) {
  return (
    <div className={`f101-card${active ? " f101-card--active" : ""}`}>
      <div className="f101-card-num">{num}</div>
      <h2 className="f101-card-title">{title}</h2>
      <p className="f101-card-body">{body}</p>

      {LEGS.map((leg) => {
        const r = scenario.ranges[leg.key];
        const val = vals[leg.key];
        const pct = ((val - r.min) / (r.max - r.min)) * 100;
        const restricted = scenario.restricted === leg.key;
        return (
          <div className="f101-ctrl" key={leg.key}>
            <div className="f101-ctrl-row">
              <span>
                {leg.label}
                {restricted && <span className="f101-ctrl-lock">{scenario.reason}</span>}
              </span>
              <span className="f101-ctrl-val">{leg.fmt(val)}</span>
            </div>
            <input
              type="range"
              className="gp-slider"
              aria-label={leg.label}
              min={r.min}
              max={r.max}
              step={r.step}
              value={val}
              style={{ ["--p" as string]: `${pct}%` }}
              onChange={(e) => onChange({ ...vals, [leg.key]: parseFloat(e.target.value) })}
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
