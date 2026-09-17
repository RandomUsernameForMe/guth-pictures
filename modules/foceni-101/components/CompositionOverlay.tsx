"use client";

import { goldenSpiralPoints, type OverlayKind } from "./compositions";

interface Props {
  kind: OverlayKind;
  /** Where the rule puts the subject, as 0..1 screen fractions. */
  markX: number;
  markY: number;
  show: boolean;
}

const SPIRAL = goldenSpiralPoints();
/** Kinds that mark where the subject sits, rather than just drawing a grid. */
const MARKED: OverlayKind[] = ["thirds", "golden", "leading"];

export function CompositionOverlay({ kind, markX, markY, show }: Props) {
  const sx = markX * 100;
  const sy = markY * 100;
  return (
    <div className={`f101-comp-overlay${show ? " f101-comp-overlay--on" : ""}`} aria-hidden>
      {/* preserveAspectRatio="none": the viewBox is normalized screen space, the
          same space ORB_LAYOUTS is authored in, so guides and balls stay aligned. */}
      <svg className="f101-comp-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
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
            <line className="f101-comp-faint" x1="38.2" y1="0" x2="38.2" y2="100" />
            <line className="f101-comp-faint" x1="61.8" y1="0" x2="61.8" y2="100" />
            <line className="f101-comp-faint" x1="0" y1="38.2" x2="100" y2="38.2" />
            <line className="f101-comp-faint" x1="0" y1="61.8" x2="100" y2="61.8" />
            <polyline className="f101-comp-spiral" points={SPIRAL} />
          </>
        )}
        {kind === "leading" && (
          // The lines are the balls themselves now; these only trace where they lead.
          <>
            <line className="f101-comp-faint" x1="-2.5" y1="97.5" x2={sx} y2={sy} />
            <line className="f101-comp-faint" x1="102.5" y1="97.5" x2={sx} y2={sy} />
          </>
        )}
        {/* `space` and `frame` draw nothing: the emptiness and the ring of
            out-of-focus balls are the lesson, a box on top only muddies them. */}
      </svg>
      {/* Outside the SVG so the stretched viewBox can't squash it into an ellipse. */}
      {MARKED.includes(kind) && (
        <span className="f101-comp-mark" style={{ left: `${sx}%`, top: `${sy}%` }} />
      )}
    </div>
  );
}
