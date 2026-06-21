"use client";

import type { OverlayKind } from "./compositions";

interface Props {
  kind: OverlayKind;
  /** Subject horizontal position as a 0..1 screen fraction (for leading/space). */
  subjectX: number;
  show: boolean;
}

export function CompositionOverlay({ kind, subjectX, show }: Props) {
  const sx = subjectX * 100;
  return (
    <svg
      className={`f101-comp-overlay${show ? " f101-comp-overlay--on" : ""}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      {kind === "thirds" && (
        <>
          <line x1="33.33" y1="0" x2="33.33" y2="100" />
          <line x1="66.66" y1="0" x2="66.66" y2="100" />
          <line x1="0" y1="33.33" x2="100" y2="33.33" />
          <line x1="0" y1="66.66" x2="100" y2="66.66" />
        </>
      )}
      {kind === "center" && (
        <>
          <line x1="50" y1="0" x2="50" y2="100" />
          <line className="f101-comp-faint" x1="0" y1="50" x2="100" y2="50" />
        </>
      )}
      {kind === "golden" && (
        <>
          <line x1="38.2" y1="0" x2="38.2" y2="100" />
          <line x1="61.8" y1="0" x2="61.8" y2="100" />
          <line x1="0" y1="38.2" x2="100" y2="38.2" />
          <line x1="0" y1="61.8" x2="100" y2="61.8" />
        </>
      )}
      {kind === "leading" && (
        <>
          <line x1="0" y1="0" x2={sx} y2="55" />
          <line x1="100" y1="0" x2={sx} y2="55" />
          <line x1="0" y1="100" x2={sx} y2="55" />
          <line x1="100" y1="100" x2={sx} y2="55" />
        </>
      )}
      {kind === "space" && (
        <rect
          className="f101-comp-space"
          x={subjectX < 0.5 ? 50 : 0}
          y="0"
          width="50"
          height="100"
        />
      )}
    </svg>
  );
}
