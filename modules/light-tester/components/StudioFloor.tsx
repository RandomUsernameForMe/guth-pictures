"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Light, LightType } from "./types";
import { TYPE_INFO } from "./types";
import { lightColorCSS } from "./colorUtils";

const FLOOR_W = 6;
const SUBJECT_Y = 1.55;

interface Props {
  lights: Light[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, pos: { x: number; z: number }) => void;
  onUpdate: (id: string, patch: Partial<Light>) => void;
  onAdd: (type: LightType) => void;
  cameraPos: { x: number; z: number };
  onMoveCamera: (pos: { x: number; z: number }) => void;
}

type DragMode = "move" | "aim" | "height" | "camera" | "sun-azimuth";

interface DragState {
  id: string;
  mode: DragMode;
  startClientY?: number;
  startHeight?: number;
}

export function StudioFloor({ lights, selectedId, onSelect, onMove, onUpdate, onAdd, cameraPos, onMoveCamera }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(() => {
      const r = wrap.getBoundingClientRect();
      const s = Math.min(r.width, r.height);
      setSize({ w: s, h: s });
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const m2p = useCallback((m: number) => (m / FLOOR_W + 0.5) * size.w, [size.w]);
  const p2m = useCallback((p: number) => (p / size.w - 0.5) * FLOOR_W, [size.w]);

  useEffect(() => {
    function getRel(e: MouseEvent) {
      const wrap = wrapRef.current;
      if (!wrap) return null;
      const rect = wrap.getBoundingClientRect();
      return {
        x: e.clientX - rect.left - (rect.width - size.w) / 2,
        y: e.clientY - rect.top - (rect.height - size.h) / 2,
        clientY: e.clientY,
      };
    }

    function onMouseMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;
      const rel = getRel(e);
      if (!rel) return;

      if (d.mode === "sun-azimuth") {
        const rel = getRel(e);
        if (!rel) return;
        const dx = rel.x - cx;
        const dy = rel.y - cy;
        const angleDeg = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
        onUpdate(d.id, { azimuth: +angleDeg.toFixed(1) });
        return;
      }

      if (d.mode === "camera") {
        const half = FLOOR_W / 2;
        const x = Math.max(-half + 0.2, Math.min(half - 0.2, p2m(rel.x)));
        const z = Math.max(-half + 0.2, Math.min(half - 0.2, p2m(rel.y)));
        onMoveCamera({ x, z });
        return;
      }

      const L = lights.find((l) => l.id === d.id);
      if (!L) return;

      if (d.mode === "move") {
        const half = FLOOR_W / 2;
        const x = Math.max(-half + 0.2, Math.min(half - 0.2, p2m(rel.x)));
        const z = Math.max(-half + 0.2, Math.min(half - 0.2, p2m(rel.y)));
        onMove(d.id, { x, z });
      } else if (d.mode === "aim") {
        const half = FLOOR_W / 2;
        const ax = Math.max(-half, Math.min(half, p2m(rel.x)));
        const az = Math.max(-half, Math.min(half, p2m(rel.y)));
        onUpdate(d.id, { aim: { x: ax, z: az, y: SUBJECT_Y } });
      } else if (d.mode === "height") {
        const dy = (d.startClientY ?? 0) - rel.clientY;
        const newH = Math.max(0.5, Math.min(3.0, (d.startHeight ?? 2) + dy * 0.005));
        onUpdate(d.id, { height: +newH.toFixed(2) });
      }
    }

    function onMouseUp() {
      dragRef.current = null;
      document.body.style.cursor = "";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [lights, onMove, onUpdate, p2m, size.w, size.h]);

  const cx = size.w / 2;
  const cy = size.h / 2;
  const subjectPx = { x: m2p(0), y: m2p(0) };
  const camPx = { x: m2p(cameraPos.x), y: m2p(cameraPos.z) };

  const aimPoint = (L: Light) => {
    if (L.aim && typeof L.aim.x === "number") return { x: L.aim.x, z: L.aim.z };
    return { x: 0, z: 0 };
  };

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", overflow: "hidden" }}
    >
      <svg width={size.w} height={size.h} style={{ display: "block" }}>
        <defs>
          <pattern id="grid-floor" width={size.w / 6} height={size.w / 6} patternUnits="userSpaceOnUse">
            <path d={`M ${size.w / 6} 0 L 0 0 0 ${size.w / 6}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          </pattern>
          <pattern id="grid-fine" width={size.w / 30} height={size.w / 30} patternUnits="userSpaceOnUse">
            <path d={`M ${size.w / 30} 0 L 0 0 0 ${size.w / 30}`} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={size.w} height={size.h} fill="url(#grid-fine)" />
        <rect width={size.w} height={size.h} fill="url(#grid-floor)" />

        <text x={size.w - 8} y={cy - 4} textAnchor="end" fontFamily="Geist Mono, monospace" fontSize={10} fill="#5C5A5E" letterSpacing="0.1em">+X</text>
        <text x={cx + 4} y={12} fontFamily="Geist Mono, monospace" fontSize={10} fill="#5C5A5E" letterSpacing="0.1em">−Z</text>
        <text x={cx + 4} y={size.h - 4} fontFamily="Geist Mono, monospace" fontSize={10} fill="#5C5A5E" letterSpacing="0.1em">+Z</text>

        <line x1={0} y1={cy} x2={size.w} y2={cy} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />
        <line x1={cx} y1={0} x2={cx} y2={size.h} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" />

        {/* Sun directional rays */}
        {lights.filter((L) => L.type === "sun" && L.on).map((L) => {
          const az = ((L.azimuth ?? 45) * Math.PI) / 180;
          const edgeR = size.w * 0.44;
          const sx = cx + Math.sin(az) * edgeR;
          const sy = cy + Math.cos(az) * edgeR;
          const color = lightColorCSS(L.kelvin, L.gel);
          const opacity = 0.08 + (L.power / 100) * 0.18;
          // parallel rays
          const perpX = Math.cos(az);
          const perpY = -Math.sin(az);
          return (
            <g key={`sun-ray-${L.id}`} style={{ pointerEvents: "none" }}>
              {[-0.18, -0.09, 0, 0.09, 0.18].map((offset) => {
                const ox = perpX * offset * size.w;
                const oy = perpY * offset * size.w;
                return (
                  <line
                    key={offset}
                    x1={sx + ox} y1={sy + oy}
                    x2={cx + ox * 0.3} y2={cy + oy * 0.3}
                    stroke={color} strokeWidth={offset === 0 ? 1.5 : 1}
                    opacity={opacity * (offset === 0 ? 1 : 0.5)}
                  />
                );
              })}
            </g>
          );
        })}

        {lights.map((L) => {
          if (!L.on || L.type === "sun") return null;
          const tx = m2p(L.x), ty = m2p(L.z);
          const aim = aimPoint(L);
          const sx = m2p(aim.x), sy = m2p(aim.z);
          const dx = sx - tx, dy = sy - ty;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.001) return null;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const spreadDeg = 25 + (L.size || 50) * 0.25;
          const reach = Math.min(dist * 1.4 + size.w * 0.05, size.w * 0.7);
          const color = lightColorCSS(L.kelvin, L.gel);
          const opacity = 0.10 + (L.power / 100) * 0.20;
          return (
            <g key={`cone-${L.id}`} transform={`translate(${tx} ${ty}) rotate(${angle})`} style={{ color, opacity, pointerEvents: "none" }}>
              <path d={`M 0 0 L ${reach} ${-Math.tan(spreadDeg * Math.PI / 180) * reach} A ${reach} ${reach} 0 0 1 ${reach} ${Math.tan(spreadDeg * Math.PI / 180) * reach} Z`} fill="currentColor" />
            </g>
          );
        })}

        {(() => {
          const L = lights.find((l) => l.id === selectedId);
          if (!L || !L.on || L.type === "sun") return null;
          const tx = m2p(L.x), ty = m2p(L.z);
          const aim = aimPoint(L);
          const ax = m2p(aim.x), ay = m2p(aim.z);
          const isLocked = !L.aim;
          return (
            <line x1={tx} y1={ty} x2={ax} y2={ay}
              stroke={isLocked ? "#5C5A5E" : "#F2F0EB"}
              strokeWidth="1"
              strokeDasharray={isLocked ? "4 4" : "0"}
              opacity="0.5"
              style={{ pointerEvents: "none" }}
            />
          );
        })()}

        <g transform={`translate(${subjectPx.x} ${subjectPx.y})`} style={{ pointerEvents: "none" }}>
          <circle r={size.w * 0.045} fill="rgba(242,240,235,0.10)" stroke="rgba(242,240,235,0.40)" strokeDasharray="3 3" strokeWidth="1.5" />
          <circle r={size.w * 0.022} fill="rgba(242,240,235,0.20)" />
          <line x1={0} y1={0} x2={0} y2={-size.w * 0.075} stroke="rgba(242,240,235,0.5)" strokeWidth="1.5" />
          <text y={size.w * 0.075} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize={9} fill="#9B9899" letterSpacing="0.15em">SUBJECT</text>
        </g>

        {/* camera direction line to subject */}
        <line
          x1={camPx.x} y1={camPx.y}
          x2={subjectPx.x} y2={subjectPx.y}
          stroke="var(--color-accent-secondary)" strokeWidth="1" opacity="0.35"
          strokeDasharray="4 4"
          style={{ pointerEvents: "none" }}
        />
      </svg>

      {/* Aim handle for selected light */}
      {(() => {
        const L = lights.find((l) => l.id === selectedId);
        if (!L || !L.on || L.type === "sun") return null;
        const aim = aimPoint(L);
        const ax = m2p(aim.x);
        const ay = m2p(aim.z);
        const isLocked = !L.aim;
        return (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dragRef.current = { id: L.id, mode: "aim" };
              document.body.style.cursor = "crosshair";
            }}
            title={isLocked ? "Tažením odemkneš směr" : "Tažením změníš směr"}
            style={{
              position: "absolute",
              left: `calc(50% - ${size.w / 2}px + ${ax}px)`,
              top: `calc(50% - ${size.h / 2}px + ${ay}px)`,
              transform: "translate(-50%, -50%)",
              width: 22, height: 22,
              borderRadius: "50%",
              border: `1.5px solid ${isLocked ? "#5C5A5E" : "#F2F0EB"}`,
              background: isLocked ? "transparent" : "rgba(242,240,235,0.12)",
              cursor: "crosshair",
              zIndex: 6,
              display: "grid",
              placeItems: "center",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLocked ? "#5C5A5E" : "#F2F0EB" }} />
          </div>
        );
      })()}

      {/* Camera puck */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = { id: "__camera__", mode: "camera" };
          document.body.style.cursor = "grabbing";
        }}
        title="Táhni pro přesun kamery"
        style={{
          position: "absolute",
          left: `calc(50% - ${size.w / 2}px + ${camPx.x}px)`,
          top: `calc(50% - ${size.h / 2}px + ${camPx.y}px)`,
          transform: "translate(-50%, -50%)",
          zIndex: 4,
          userSelect: "none",
        }}
      >
        <div
          style={{
            width: 36, height: 24,
            borderRadius: 3,
            background: "color-mix(in srgb, var(--color-accent-secondary) 12%, transparent)",
            border: "1.5px solid var(--color-accent-secondary)",
            boxShadow: "0 0 14px color-mix(in srgb, var(--color-accent-secondary) 25%, transparent)",
            display: "grid",
            placeItems: "center",
            cursor: "grab",
            position: "relative",
          }}
        >
          {/* Lens circle */}
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            border: "1.5px solid var(--color-accent-secondary)",
          }} />
        </div>
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
          fontFamily: "Geist Mono, monospace",
          fontSize: 9,
          color: "var(--color-accent-secondary)",
          whiteSpace: "nowrap",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}>
          CAM
        </div>
      </div>

      {/* Sun indicators on circle edge */}
      {lights.filter((L) => L.type === "sun").map((L) => {
        const az = ((L.azimuth ?? 45) * Math.PI) / 180;
        const edgeR = size.w * 0.44;
        const tx = cx + Math.sin(az) * edgeR;
        const ty = cy + Math.cos(az) * edgeR;
        const isSelected = L.id === selectedId;
        const isOff = !L.on;
        const emitColor = isOff ? "rgba(255,255,255,0.30)" : lightColorCSS(L.kelvin, L.gel);
        return (
          <div key={L.id} style={{
            position: "absolute",
            left: `calc(50% - ${size.w / 2}px + ${tx}px)`,
            top: `calc(50% - ${size.h / 2}px + ${ty}px)`,
            transform: "translate(-50%, -50%)",
            zIndex: isSelected ? 5 : 3,
            userSelect: "none",
          }}>
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(L.id);
                dragRef.current = { id: L.id, mode: "sun-azimuth" };
                document.body.style.cursor = "crosshair";
              }}
              title="Táhni pro změnu azimutu"
              style={{
                width: 38, height: 38,
                borderRadius: "50%",
                background: isOff ? "rgba(255,255,255,0.04)" : `color-mix(in srgb, ${emitColor} 20%, transparent)`,
                border: `1.5px solid ${emitColor}`,
                boxShadow: isSelected
                  ? `0 0 0 3px rgba(255,255,255,0.10), 0 0 24px ${emitColor}`
                  : isOff ? "none" : `0 0 16px color-mix(in srgb, ${emitColor} 35%, transparent)`,
                color: isOff ? "rgba(242,240,235,0.40)" : emitColor,
                fontFamily: "Geist Mono, monospace",
                fontSize: 14,
                display: "grid",
                placeItems: "center",
                cursor: "crosshair",
                transition: "box-shadow 200ms",
              }}
            >
              ✦
            </div>
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
              fontFamily: "Geist Mono, monospace",
              fontSize: 10,
              color: isSelected ? "#F2F0EB" : "#9B9899",
              whiteSpace: "nowrap",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}>
              Sun · {Math.round(L.power)}%
            </div>
          </div>
        );
      })}

      {/* Light pucks */}
      {lights.filter((L) => L.type !== "sun").map((L) => {
        const tx = m2p(L.x);
        const ty = m2p(L.z);
        const info = TYPE_INFO[L.type] ?? TYPE_INFO.key;
        const isSelected = L.id === selectedId;
        const isOff = !L.on;
        const isSoftbox = L.type === "softbox";
        const hRingR = 10 + L.height * 6;
        const emitColor = isOff ? "rgba(255,255,255,0.30)" : lightColorCSS(L.kelvin, L.gel);

        return (
          <div key={L.id} style={{
            position: "absolute",
            left: `calc(50% - ${size.w / 2}px + ${tx}px)`,
            top: `calc(50% - ${size.h / 2}px + ${ty}px)`,
            transform: "translate(-50%, -50%)",
            zIndex: isSelected ? 5 : 3,
            userSelect: "none",
          }}>
            {isSelected && (
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = { id: L.id, mode: "height", startClientY: e.clientY, startHeight: L.height };
                  document.body.style.cursor = "ns-resize";
                }}
                title={`Výška ${L.height.toFixed(2)} m — táhni nahoru / dolů`}
                style={{
                  position: "absolute",
                  left: "50%", top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: hRingR * 2, height: hRingR * 2,
                  borderRadius: "50%",
                  border: "1.5px dashed rgba(242,240,235,0.55)",
                  cursor: "ns-resize",
                  zIndex: 1,
                }}
              >
                <span style={{
                  position: "absolute",
                  top: -8, left: "50%", transform: "translateX(-50%)",
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 9,
                  color: "#F2F0EB",
                  letterSpacing: "0.1em",
                  background: "rgba(10,10,11,0.9)",
                  padding: "2px 6px",
                  borderRadius: 3,
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}>
                  H {L.height.toFixed(2)}m
                </span>
              </div>
            )}

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(L.id);
                dragRef.current = { id: L.id, mode: "move" };
                document.body.style.cursor = "grabbing";
              }}
              style={{
                width: isSoftbox ? 60 : 38,
                height: 38,
                borderRadius: isSoftbox ? 4 : "50%",
                background: isOff ? "rgba(255,255,255,0.04)" : `color-mix(in srgb, ${emitColor} 20%, transparent)`,
                border: `1.5px solid ${emitColor}`,
                boxShadow: isSelected
                  ? `0 0 0 3px rgba(255,255,255,0.10), 0 0 24px ${emitColor}`
                  : isOff ? "none" : `0 0 16px color-mix(in srgb, ${emitColor} 35%, transparent)`,
                color: isOff ? "rgba(242,240,235,0.40)" : emitColor,
                fontFamily: "Geist Mono, monospace",
                fontSize: 13,
                fontWeight: 600,
                display: "grid",
                placeItems: "center",
                cursor: "grab",
                transition: "box-shadow 200ms",
                position: "relative",
                zIndex: 2,
              }}
            >
              {info.short}
            </div>

            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
              fontFamily: "Geist Mono, monospace",
              fontSize: 10,
              color: isSelected ? "#F2F0EB" : "#9B9899",
              whiteSpace: "nowrap",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              pointerEvents: "none",
            }}>
              {info.label} · {Math.round(L.power)}%{L.aim ? " · 🔓" : ""}
            </div>
          </div>
        );
      })}

      {/* Corner info + add buttons */}
      <div style={{
        position: "absolute", bottom: 12, left: 14,
        fontFamily: "Geist Mono, monospace", fontSize: 10, color: "#5C5A5E",
        letterSpacing: "0.15em", textTransform: "uppercase",
        display: "flex", gap: 12, alignItems: "baseline",
      }}>
        <span>Studio · top-down</span>
        <span style={{ color: "#9B9899" }}>1m grid · puk = pozice · prstenec = výška · cíl = směr</span>
      </div>

      <div style={{
        position: "absolute", bottom: 10, right: 12,
        display: "flex", gap: 6,
      }}>
        {(["key", "fill", "rim", "beauty", "softbox", "sun"] as LightType[]).map((t) => {
          const info = TYPE_INFO[t];
          return (
            <button
              key={t}
              onClick={() => onAdd(t)}
              style={{
                padding: "5px 9px",
                border: "1px dashed rgba(255,255,255,0.18)",
                borderRadius: 4,
                background: "transparent",
                fontFamily: "Geist Mono, monospace",
                fontSize: 10,
                color: "#9B9899",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                transition: "all 200ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.45)";
                (e.currentTarget as HTMLButtonElement).style.color = "#F2F0EB";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLButtonElement).style.color = "#9B9899";
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: info.color, display: "inline-block" }} />
              +{info.short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
