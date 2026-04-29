/* global React */
/* Top-down studio floor with drag&drop lights + height handle + aim handle.
   Floor coords: x ∈ [-3, 3], z ∈ [-3, 3]. Subject at origin. Camera at z=+1.6.

   Light gestures:
   - Drag main puck: move position
   - Drag height ring (above/right of puck): change height (0.5–3.0 m)
   - Drag aim handle (the cone tip pointing into the room): set custom aim
     (when L.aim is null/undefined the cone auto-tracks the subject)
*/

(function () {
  const { useRef, useEffect, useState, useCallback } = React;

  const FLOOR_W = 6; // metres
  const SUBJECT_Y = 1.55;
  const TYPE_INFO = {
    key:     { label: 'Key',     color: '#C8A96E', short: 'K' },
    fill:    { label: 'Fill',    color: '#78B4DC', short: 'F' },
    rim:     { label: 'Rim',     color: '#DC6EC8', short: 'R' },
    beauty:  { label: 'Beauty',  color: '#6EDCA0', short: 'B' },
    softbox: { label: 'Softbox', color: '#E8D49A', short: 'S' },
  };

  function StudioFloor({ lights, selectedId, onSelect, onMove, onUpdate, camPos, onCamPosChange }) {
    const wrapRef = useRef(null);
    const [size, setSize] = useState({ w: 600, h: 600 });
    const dragRef = useRef(null); // { id?, mode: 'move'|'aim'|'height'|'camera', startY, startHeight }

    useEffect(() => {
      const wrap = wrapRef.current; if (!wrap) return;
      const ro = new ResizeObserver(() => {
        const r = wrap.getBoundingClientRect();
        const s = Math.min(r.width, r.height);
        setSize({ w: s, h: s });
      });
      ro.observe(wrap);
      return () => ro.disconnect();
    }, []);

    const m2p = useCallback((m) => (m / FLOOR_W + 0.5) * size.w, [size]);
    const p2m = useCallback((p) => (p / size.w - 0.5) * FLOOR_W, [size]);

    useEffect(() => {
      function getRel(e) {
        const wrap = wrapRef.current; if (!wrap) return null;
        const rect = wrap.getBoundingClientRect();
        return {
          x: e.clientX - rect.left - (rect.width - size.w) / 2,
          y: e.clientY - rect.top - (rect.height - size.h) / 2,
          clientX: e.clientX,
          clientY: e.clientY,
        };
      }
      function onMouseMove(e) {
        const d = dragRef.current; if (!d) return;
        const rel = getRel(e); if (!rel) return;

        if (d.mode === 'camera') {
          const x = Math.max(-FLOOR_W / 2 + 0.1, Math.min(FLOOR_W / 2 - 0.1, p2m(rel.x)));
          const z = Math.max(-FLOOR_W / 2 + 0.1, Math.min(FLOOR_W / 2 - 0.1, p2m(rel.y)));
          onCamPosChange && onCamPosChange({ x, z });
          return;
        }

        const L = lights.find(l => l.id === d.id); if (!L) return;

        if (d.mode === 'move') {
          const x = Math.max(-FLOOR_W / 2 + 0.2, Math.min(FLOOR_W / 2 - 0.2, p2m(rel.x)));
          const z = Math.max(-FLOOR_W / 2 + 0.2, Math.min(FLOOR_W / 2 - 0.2, p2m(rel.y)));
          onMove(d.id, { x, z });
        } else if (d.mode === 'aim') {
          const ax = Math.max(-FLOOR_W / 2, Math.min(FLOOR_W / 2, p2m(rel.x)));
          const az = Math.max(-FLOOR_W / 2, Math.min(FLOOR_W / 2, p2m(rel.y)));
          onUpdate(d.id, { aim: { x: ax, z: az, y: SUBJECT_Y } });
        } else if (d.mode === 'height') {
          const dy = d.startClientY - rel.clientY;
          const newH = Math.max(0.5, Math.min(3.0, d.startHeight + dy * 0.005));
          onUpdate(d.id, { height: +newH.toFixed(2) });
        }
      }
      function onMouseUp() {
        dragRef.current = null;
        document.body.style.cursor = '';
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }, [lights, onMove, onUpdate, onCamPosChange, p2m, size.w, size.h]);

    const cx = size.w / 2, cy = size.h / 2;
    const subjectPx = { x: m2p(0), y: m2p(0) };
    const resolvedCam = camPos || { x: 0, z: 1.6 };
    const camPx = { x: m2p(resolvedCam.x), y: m2p(resolvedCam.z) };

    // Helper: get aim point in floor coords for a light
    const aimPoint = (L) => {
      if (L.aim && typeof L.aim.x === 'number') return { x: L.aim.x, z: L.aim.z };
      return { x: 0, z: 0 };
    };

    return (
      <div ref={wrapRef} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        <svg width={size.w} height={size.h} style={{ display: 'block' }}>
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

          {/* light cones */}
          {lights.map(L => {
            if (L.on === false) return null;
            const tx = m2p(L.x), ty = m2p(L.z);
            const aim = aimPoint(L);
            const sx = m2p(aim.x), sy = m2p(aim.z);
            const dx = sx - tx, dy = sy - ty;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.001) return null;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const spreadDeg = 25 + (L.size || 50) * 0.25;
            const reach = Math.min(dist * 1.4 + size.w * 0.05, size.w * 0.7);
            const color = TYPE_INFO[L.type]?.color || '#C8A96E';
            const opacity = 0.10 + (L.power / 100) * 0.20;
            return (
              <g key={`cone-${L.id}`} transform={`translate(${tx} ${ty}) rotate(${angle})`} style={{ color, opacity, pointerEvents: 'none' }}>
                <path d={`M 0 0 L ${reach} ${-Math.tan(spreadDeg * Math.PI / 180) * reach} A ${reach} ${reach} 0 0 1 ${reach} ${Math.tan(spreadDeg * Math.PI / 180) * reach} Z`} fill="currentColor" />
              </g>
            );
          })}

          {/* aim line for selected light */}
          {(() => {
            const L = lights.find(l => l.id === selectedId);
            if (!L || L.on === false) return null;
            const tx = m2p(L.x), ty = m2p(L.z);
            const aim = aimPoint(L);
            const ax = m2p(aim.x), ay = m2p(aim.z);
            const isLocked = !L.aim;
            return (
              <g key="aim-line" style={{ pointerEvents: 'none' }}>
                <line x1={tx} y1={ty} x2={ax} y2={ay}
                  stroke={isLocked ? '#5C5A5E' : '#F2F0EB'}
                  strokeWidth="1"
                  strokeDasharray={isLocked ? '4 4' : '0'}
                  opacity="0.5" />
              </g>
            );
          })()}

          {/* subject */}
          <g transform={`translate(${subjectPx.x} ${subjectPx.y})`} style={{ pointerEvents: 'none' }}>
            <circle r={size.w * 0.045} fill="rgba(242,240,235,0.10)" stroke="rgba(242,240,235,0.40)" strokeDasharray="3 3" strokeWidth="1.5" />
            <circle r={size.w * 0.022} fill="rgba(242,240,235,0.20)" />
            <line x1={0} y1={0} x2={0} y2={-size.w * 0.075} stroke="rgba(242,240,235,0.5)" strokeWidth="1.5" />
            <text y={size.w * 0.075} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize={9} fill="#9B9899" letterSpacing="0.15em">SUBJECT</text>
          </g>

          {/* camera direction line */}
          {(() => {
            const dx = subjectPx.x - camPx.x, dy = subjectPx.y - camPx.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2) return null;
            const nx = dx / dist, ny = dy / dist;
            // FOV spread cone (approximate 40° half-angle)
            const spread = 0.36;
            const len = dist - size.w * 0.045;
            const px = camPx.x + nx * len, py = camPx.y + ny * len;
            const rx = -ny * spread * len, ry = nx * spread * len;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <path d={`M ${camPx.x} ${camPx.y} L ${px + rx} ${py + ry} L ${px - rx} ${py - ry} Z`}
                  fill="rgba(200,169,110,0.07)" stroke="#C8A96E" strokeWidth="0.8" strokeOpacity="0.35" />
                <line x1={camPx.x} y1={camPx.y} x2={px} y2={py}
                  stroke="#C8A96E" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="3 3" />
              </g>
            );
          })()}

          {/* camera (draggable) */}
          <g
            transform={`translate(${camPx.x} ${camPx.y})`}
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => {
              e.preventDefault();
              dragRef.current = { mode: 'camera' };
              document.body.style.cursor = 'grabbing';
            }}
          >
            <circle r={18} fill="transparent" />
            <rect x={-14} y={-9} width={28} height={18} fill="rgba(200,169,110,0.12)" stroke="#C8A96E" strokeWidth="1.5" rx="2" />
            <circle r={5} fill="none" stroke="#C8A96E" strokeWidth="1.5" />
            <text y={28} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize={9} fill="#C8A96E" letterSpacing="0.15em">CAM</text>
          </g>
        </svg>

        {/* aim handles for selected light (drawn on top of svg, draggable) */}
        {(() => {
          const L = lights.find(l => l.id === selectedId);
          if (!L || L.on === false) return null;
          const aim = aimPoint(L);
          const ax = m2p(aim.x), ay = m2p(aim.z);
          const isLocked = !L.aim;
          return (
            <div
              key="aim-handle"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragRef.current = { id: L.id, mode: 'aim' };
                document.body.style.cursor = 'crosshair';
              }}
              title={isLocked ? 'Tažením odemkneš směr' : 'Tažením změníš směr'}
              style={{
                position: 'absolute',
                left: `calc(50% - ${size.w / 2}px + ${ax}px)`,
                top: `calc(50% - ${size.h / 2}px + ${ay}px)`,
                transform: 'translate(-50%, -50%)',
                width: 22, height: 22,
                borderRadius: '50%',
                border: `1.5px solid ${isLocked ? '#5C5A5E' : '#F2F0EB'}`,
                background: isLocked ? 'transparent' : 'rgba(242,240,235,0.12)',
                cursor: 'crosshair',
                zIndex: 6,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isLocked ? '#5C5A5E' : '#F2F0EB',
              }}></span>
            </div>
          );
        })()}

        {/* lights */}
        {lights.map(L => {
          const tx = m2p(L.x), ty = m2p(L.z);
          const info = TYPE_INFO[L.type] || TYPE_INFO.key;
          const isSelected = L.id === selectedId;
          const isOff = L.on === false;
          const isSoftbox = L.type === 'softbox';
          // Height ring radius proportional to height (purely visual + grabbable)
          const hRingR = 10 + L.height * 6;

          return (
            <div key={L.id} style={{
              position: 'absolute',
              left: `calc(50% - ${size.w / 2}px + ${tx}px)`,
              top: `calc(50% - ${size.h / 2}px + ${ty}px)`,
              transform: 'translate(-50%, -50%)',
              zIndex: isSelected ? 5 : 3,
              userSelect: 'none',
            }}>
              {/* Height ring (only on selected or on hover) */}
              {isSelected && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dragRef.current = {
                      id: L.id, mode: 'height',
                      startClientY: e.clientY,
                      startHeight: L.height,
                    };
                    document.body.style.cursor = 'ns-resize';
                  }}
                  title={`Výška ${L.height.toFixed(2)} m — táhni nahoru / dolů`}
                  style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: hRingR * 2, height: hRingR * 2,
                    borderRadius: '50%',
                    border: '1.5px dashed rgba(242,240,235,0.55)',
                    pointerEvents: 'auto',
                    cursor: 'ns-resize',
                    zIndex: 1,
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: -8, left: '50%', transform: 'translateX(-50%)',
                    fontFamily: 'Geist Mono, monospace',
                    fontSize: 9,
                    color: '#F2F0EB',
                    letterSpacing: '0.1em',
                    background: 'rgba(10,10,11,0.9)',
                    padding: '2px 6px',
                    borderRadius: 3,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                    H {L.height.toFixed(2)}m
                  </span>
                </div>
              )}

              {/* Main puck */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(L.id);
                  dragRef.current = { id: L.id, mode: 'move' };
                  document.body.style.cursor = 'grabbing';
                }}
                style={{
                  width: isSoftbox ? 60 : 38,
                  height: isSoftbox ? 38 : 38,
                  borderRadius: isSoftbox ? 4 : '50%',
                  background: isOff ? 'rgba(255,255,255,0.04)' : `color-mix(in srgb, ${info.color} 20%, transparent)`,
                  border: `1.5px solid ${isOff ? 'rgba(255,255,255,0.30)' : info.color}`,
                  boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,0.10), 0 0 24px ${info.color}` : isOff ? 'none' : `0 0 16px color-mix(in srgb, ${info.color} 35%, transparent)`,
                  color: isOff ? 'rgba(242,240,235,0.40)' : info.color,
                  fontFamily: 'Geist Mono, monospace',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'grab',
                  transition: 'box-shadow 200ms',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {info.short}
              </div>

              {/* Label below */}
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 10,
                color: isSelected ? '#F2F0EB' : '#9B9899',
                whiteSpace: 'nowrap',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                pointerEvents: 'none',
              }}>
                {info.label} · {Math.round(L.power)}%{L.aim ? ' · 🔓' : ''}
              </div>
            </div>
          );
        })}

        {/* corner labels */}
        <div style={{
          position: 'absolute', top: 12, left: 14,
          fontFamily: 'Geist Mono, monospace', fontSize: 10, color: '#5C5A5E',
          letterSpacing: '0.15em', textTransform: 'uppercase',
          display: 'flex', gap: 12, alignItems: 'baseline',
        }}>
          <span>Studio · top-down</span>
          <span style={{ color: '#9B9899' }}>1m grid · puk = pozice · prstenec = výška · cíl = směr</span>
        </div>
      </div>
    );
  }

  Object.assign(window, { StudioFloor, TYPE_INFO });
})();
