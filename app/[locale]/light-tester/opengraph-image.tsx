import { ImageResponse } from "next/og";
import { defaultColors as P } from "@/lib/theme-presets";

// Static images can't read KV — they render the shipped default preset.
const alpha = (hex: string, a: number) =>
  hex + Math.round(a * 255).toString(16).padStart(2, "0");


export const runtime = "edge";
export const alt = "Light Tester — Guth Pictures";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  bg:        P.bg,
  elevated:  P.bgElevated,
  surface:   P.surface,
  text:      P.text,
  muted:     P.textMuted,
  ghost:     P.textGhost,
  accent:    P.accentSecondary,
  border:    alpha(P.text, 0.10),
  borderSub: alpha(P.text, 0.06),
} as const;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: C.bg,
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Vertical divider */}
        <div
          style={{
            position: "absolute",
            left: 680,
            top: 0,
            bottom: 0,
            width: 1,
            background: C.borderSub,
            display: "flex",
          }}
        />

        {/* Accent top-bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(to right, ${C.accent}, transparent 60%)`,
            display: "flex",
          }}
        />

        {/* ── LEFT: Typography ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: 680,
            flexShrink: 0,
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: "flex",
              fontSize: 12,
              fontWeight: 400,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: C.ghost,
              marginBottom: 28,
            }}
          >
            GUTH PICTURES
          </div>

          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color: C.text,
                letterSpacing: -4,
                lineHeight: 0.88,
              }}
            >
              Light
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 96,
                fontWeight: 700,
                color: C.accent,
                letterSpacing: -4,
                lineHeight: 0.88,
              }}
            >
              Tester
            </div>
          </div>

          {/* Separator */}
          <div
            style={{
              display: "flex",
              width: 44,
              height: 2,
              background: C.accent,
              margin: "32px 0",
              opacity: 0.6,
            }}
          />

          {/* Subtitle */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", fontSize: 20, color: C.muted, lineHeight: 1.5 }}>
              Interaktivní simulátor
            </div>
            <div style={{ display: "flex", fontSize: 20, color: C.muted, lineHeight: 1.5 }}>
              studiového osvětlení
            </div>
          </div>

          {/* Tag chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
            {["3D scéna", "Světla", "Gely", "Presety"].map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "5px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 4,
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: C.ghost,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Top-down studio diagram ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Outer studio bounds circle */}
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
            }}
          />

          {/* Inner room circle */}
          <div
            style={{
              position: "absolute",
              width: 230,
              height: 230,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              display: "flex",
            }}
          />

          {/* KEY light — top-left — accent/warm */}
          <LightSource x={-108} y={-120} color={C.accent} label="KEY" />

          {/* FILL light — top-right — muted */}
          <LightSource x={100} y={-110} color={C.muted} label="FILL" />

          {/* RIM light — bottom-center — cool */}
          <LightSource x={0} y={138} color="#7BA7BC" label="RIM" />

          {/* Lines from lights to center */}
          <Line x1={-108} y1={-120} x2={0} y2={0} color={C.accent} opacity={0.50} />
          <Line x1={100} y1={-110} x2={0} y2={0} color={C.muted} opacity={0.38} />
          <Line x1={0} y1={138} x2={0} y2={0} color="#7BA7BC" opacity={0.42} />

          {/* Subject — center circle */}
          <div
            style={{
              position: "absolute",
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: C.surface,
              border: "2px solid rgba(255,255,255,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: C.muted,
                display: "flex",
              }}
            />
          </div>

          {/* SUBJECT label */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, 30px)",
              fontSize: 9,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.ghost,
              display: "flex",
              whiteSpace: "nowrap",
            }}
          >
            SUBJECT
          </div>

          {/* TOP VIEW label */}
          <div
            style={{
              position: "absolute",
              bottom: 20,
              right: 24,
              fontSize: 9,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: C.ghost,
              display: "flex",
            }}
          >
            TOP VIEW
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function LightSource({
  x,
  y,
  color,
  label,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          opacity: 0.55,
          display: "flex",
        }}
      />
      {/* Light body */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: color,
          opacity: 0.95,
          display: "flex",
        }}
      />
      {/* Label */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: 3,
          textTransform: "uppercase",
          color,
          opacity: 0.7,
          marginTop: 20,
          display: "flex",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Line({
  x1, y1, x2, y2, color, opacity,
}: {
  x1: number; y1: number; x2: number; y2: number;
  color: string; opacity: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return (
    <div
      style={{
        position: "absolute",
        width: length,
        height: 1,
        background: color,
        opacity,
        transform: `translate(${cx - length / 2}px, ${cy}px) rotate(${angle}deg)`,
        transformOrigin: "center",
        display: "flex",
      }}
    />
  );
}
