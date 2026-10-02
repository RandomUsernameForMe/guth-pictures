"use client";

import { useState } from "react";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { FocalPoint } from "@/modules/admin/lib/content";
import { nudgeFocal, parseFocal, toFocal } from "@/modules/admin/lib/focal";

type Device = keyof FocalPoint;
const LABELS: Record<Device, string> = { desktop: "Desktop", mobile: "Mobil" };
const STEPS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

function Marker({ value, active, device }: { value: string; active: boolean; device: Device }) {
  const { x, y } = parseFocal(value);
  return <span
    aria-hidden
    className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none grid place-items-center rounded-full border-2 ${active ? "w-7 h-7 border-white bg-black/30 shadow-[0_0_0_1px_rgba(0,0,0,.6)]" : "w-5 h-5 border-white/50 border-dashed"}`}
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <span className="text-[9px] font-semibold text-white">{device === "desktop" ? "D" : "M"}</span>
  </span>;
}

export function FocalPicker({ publicId, label, focal, onChange }: {
  publicId: string; label: string; focal: FocalPoint; onChange: (focal: FocalPoint) => void;
}) {
  const [device, setDevice] = useState<Device>("desktop");
  const set = (value: string) => onChange({ ...focal, [device]: value });

  function pick(event: React.PointerEvent<HTMLDivElement>) {
    if (event.type === "pointermove" && !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    if (event.type === "pointerdown") event.currentTarget.setPointerCapture(event.pointerId);
    set(toFocal(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const size = event.shiftKey ? 10 : 1;
    set(nudgeFocal(focal[device], step[0] * size, step[1] * size));
  }

  return <div className="space-y-2">
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-500 mr-1">Bod zájmu:</span>
      {(Object.keys(LABELS) as Device[]).map((key) => (
        <button key={key} type="button" aria-pressed={device === key} onClick={() => setDevice(key)}
          className={`px-2 py-0.5 border ${device === key ? "bg-white text-black border-white" : "border-white/20"}`}>
          {LABELS[key]}
        </button>
      ))}
      <span className="ml-auto tabular-nums text-gray-500">{focal[device]}</span>
    </div>
    <div
      role="slider"
      tabIndex={0}
      aria-label={`${label} — bod zájmu (${LABELS[device]})`}
      aria-valuetext={focal[device]}
      aria-valuenow={parseFocal(focal[device]).x}
      onPointerDown={pick}
      onPointerMove={pick}
      onKeyDown={onKeyDown}
      className="relative cursor-crosshair touch-none select-none focus:outline focus:outline-2 focus:outline-white"
    >
      <img src={cloudinaryUrl(publicId, "c_limit,w_600,q_auto,f_auto")} alt="" draggable={false} className="block w-full h-auto" />
      {(Object.keys(LABELS) as Device[]).map((key) => <Marker key={key} value={focal[key]} active={key === device} device={key} />)}
    </div>
    <p className="text-[11px] text-gray-500">Klikni nebo táhni na to, co má zůstat vidět. Šipky = jemný posun.</p>
  </div>;
}
