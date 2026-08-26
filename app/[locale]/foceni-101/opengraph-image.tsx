import { ImageResponse } from "next/og";
import { defaultColors as P } from "@/lib/theme-presets";

// Static images can't read KV — they render the shipped default preset.
const alpha = (hex: string, a: number) =>
  hex + Math.round(a * 255).toString(16).padStart(2, "0");


export const runtime = "edge";
export const alt = "Focení 101 — Guth Pictures";
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

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cs = locale !== "en";
  const title = cs ? ["Focení", "101"] : ["Photo", "101"];
  const subtitle = cs
    ? ["Interaktivní průvodce tím,", "co dělá fotku"]
    : ["An interactive guide to", "what makes a photo"];
  const tags = cs
    ? ["Clona", "Čas", "ISO", "Kompozice"]
    : ["Aperture", "Shutter", "ISO", "Composition"];
  const legs = cs
    ? { ap: "CLONA", sh: "ČAS", iso: "ISO" }
    : { ap: "APERTURE", sh: "SHUTTER", iso: "ISO" };

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
          <div
            style={{
              display: "flex",
              fontSize: 12,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: C.ghost,
              marginBottom: 28,
            }}
          >
            GUTH PICTURES
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
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
              {title[0]}
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
              {title[1]}
            </div>
          </div>

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

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {subtitle.map((line) => (
              <div key={line} style={{ display: "flex", fontSize: 20, color: C.muted, lineHeight: 1.5 }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 32 }}>
            {tags.map((tag) => (
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

        {/* ── RIGHT: Exposure triangle diagram ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Triangle edges: apex (0,-130), bottom-left (-120,90), bottom-right (120,90) */}
          <Line x1={0} y1={-130} x2={-120} y2={90} color={C.accent} opacity={0.45} />
          <Line x1={0} y1={-130} x2={120} y2={90} color={C.accent} opacity={0.45} />
          <Line x1={-120} y1={90} x2={120} y2={90} color={C.accent} opacity={0.45} />

          <Node x={0} y={-130} color={C.accent} label={legs.ap} labelDy={-46} />
          <Node x={-120} y={90} color={C.muted} label={legs.sh} labelDy={34} />
          <Node x={120} y={90} color="#7BA7BC" label={legs.iso} labelDy={34} />

          {/* Centre: balanced-exposure readout */}
          <div
            style={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: "translateY(14px)",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                color: C.text,
                letterSpacing: -1,
              }}
            >
              0.0 EV
            </div>
            {/* Meter bar with centre tick */}
            <div
              style={{
                display: "flex",
                width: 130,
                height: 8,
                borderRadius: 4,
                border: `1px solid ${C.border}`,
                background: C.surface,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: "50%",
                  height: "100%",
                  borderRadius: 4,
                  background: C.accent,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: -3,
                  bottom: -3,
                  width: 2,
                  background: C.text,
                  display: "flex",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

function Node({
  x, y, color, label, labelDy,
}: {
  x: number; y: number; color: string; label: string; labelDy: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
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
      <div
        style={{
          position: "absolute",
          transform: `translateY(${labelDy}px)`,
          fontSize: 10,
          letterSpacing: 3,
          textTransform: "uppercase",
          color,
          opacity: 0.75,
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
        transform: `translate(${cx}px, ${cy}px) rotate(${angle}deg)`,
        transformOrigin: "center",
        display: "flex",
      }}
    />
  );
}
