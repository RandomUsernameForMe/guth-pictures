"use client";

import { useTranslations } from "next-intl";
import { computeLight } from "./light";
import type { PhotoParams } from "./types";

const RANGE = 3; // EV shown on each side of correct

export function ExposureMeter({ params, show }: { params: PhotoParams; show: boolean }) {
  const t = useTranslations("foceni101.meter");
  const { evDelta } = computeLight(params);
  const clamped = Math.max(-RANGE, Math.min(RANGE, evDelta));
  const pct = ((clamped + RANGE) / (2 * RANGE)) * 100; // 0..100, 50 = correct
  const word = evDelta > 0.4 ? t("over") : evDelta < -0.4 ? t("under") : t("ok");
  return (
    <div className={`f101-meter${show ? " f101-meter--on" : ""}`}>
      <div className="f101-meter-track" aria-hidden>
        <span className="f101-meter-fill" style={{ width: `${pct}%` }} />
        <span className="f101-meter-tick" />
      </div>
      <div className="f101-meter-label">
        {t("label")} {evDelta >= 0 ? "+" : ""}{evDelta.toFixed(1)} EV · {word}
      </div>
    </div>
  );
}
