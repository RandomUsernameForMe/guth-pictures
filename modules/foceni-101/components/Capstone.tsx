"use client";

import { useTranslations } from "next-intl";
import { fmtShutter, fmtIso } from "./sections";
import type { CapVals, CapLeg, CapstoneMechanic } from "./capstones";

interface Props {
  num: string;
  title: string;
  body: string;
  /** Section id — keys the reason badge in messages (`foceni101.capstones.<id>.reason`). */
  sectionId: string;
  scenario: CapstoneMechanic;
  vals: CapVals;
  onChange: (v: CapVals) => void;
  solved: boolean;
  active: boolean;
}

const LEGS: { key: CapLeg; labelKey: string; fmt: (v: number) => string; invert?: boolean }[] = [
  { key: "aperture", labelKey: "ctrl.aperture", fmt: (v) => `f/${v.toFixed(1)}`, invert: true },
  { key: "shutter", labelKey: "ctrl.shutter", fmt: fmtShutter },
  { key: "iso", labelKey: "ctrl.iso", fmt: fmtIso },
];

export function Capstone({ num, title, body, sectionId, scenario, vals, onChange, solved, active }: Props) {
  const t = useTranslations("foceni101");
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
                {t(leg.labelKey)}
                {restricted && (
                  <span className="f101-ctrl-lock">{t(`capstones.${sectionId}.reason`)}</span>
                )}
              </span>
              <span className="f101-ctrl-val">{leg.fmt(val)}</span>
            </div>
            <input
              type="range"
              className="gp-slider"
              aria-label={t(leg.labelKey)}
              min={r.min}
              max={r.max}
              step={r.step}
              value={val}
              style={{
                ["--p" as string]: `${leg.invert ? 100 - pct : pct}%`,
                direction: leg.invert ? "rtl" : undefined,
              }}
              onChange={(e) => onChange({ ...vals, [leg.key]: parseFloat(e.target.value) })}
            />
          </div>
        );
      })}

      <p className={`f101-capstone-win${solved ? " f101-capstone-win--on" : ""}`}>
        {t("capstoneWin")}
      </p>
    </div>
  );
}
