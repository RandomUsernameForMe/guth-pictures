"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";

export type Triptych = [string[], string[], string[]];
export type Slot = 0 | 1 | 2;

// Hero triptych web už nevykresluje — sekce je jen skrytá, data v KV zůstávají.
export const SHOW_HERO_TRIPTYCH = false;

export const PANEL_LABELS = ["Panel 1 · Portréty", "Panel 2 · Eventy", "Panel 3 · Portréty"];

export function HeroTriptychEditor({ triptych, setTriptych, activeSlot, setActiveSlot }: {
  triptych: Triptych; setTriptych: (t: Triptych) => void; activeSlot: Slot | null; setActiveSlot: (s: Slot | null) => void;
}) {
  const router = useRouter();
  const [triptychSaving, setTriptychSaving] = useState(false);
  const [triptychMsg, setTriptychMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!SHOW_HERO_TRIPTYCH) return null;

  async function handleSaveTriptych() {
    setTriptychSaving(true);
    setTriptychMsg(null);
    try {
      const current = await fetch("/api/admin/images").then((r) => r.json());
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: current.profile ?? "", heroTriptych: triptych }),
      });
      setTriptychMsg(res.ok ? { ok: true, text: "Uloženo" } : { ok: false, text: "Chyba při ukládání" });
      if (res.ok) router.refresh();
    } catch {
      setTriptychMsg({ ok: false, text: "Chyba při ukládání" });
    }
    setTriptychSaving(false);
  }

  function handleRemoveFromSlot(slot: Slot, publicId: string) {
    const next = triptych.map((arr) => [...arr]) as Triptych;
    next[slot] = next[slot].filter((id) => id !== publicId);
    setTriptych(next);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">Hero triptych</h2>
      <p className="text-xs text-gray-500 mb-4">
        Klikni slot → klikni fotku níže. Aktivní slot = bílý rámeček.
      </p>
      {/* Slot preview — 3 panels */}
      <div className="flex gap-3 mb-3 max-w-2xl">
        {([0, 1, 2] as const).map((slot) => {
          const ids = triptych[slot];
          const first = ids[0];
          return (
            <button
              key={slot}
              onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
              className={`relative flex-1 aspect-[3/4] border-2 overflow-hidden transition-colors ${
                activeSlot === slot
                  ? "border-white"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {first ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cloudinaryUrl(first, "w_300,c_fill,q_auto")}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                  Prázdný
                </span>
              )}
              {ids.length > 0 && (
                <span className="absolute top-1 left-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5">
                  {ids.length} foto
                </span>
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-xs text-gray-400 text-left">
                {PANEL_LABELS[slot]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active slot image strip */}
      {activeSlot !== null && triptych[activeSlot].length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 max-w-2xl">
          {triptych[activeSlot].map((pid) => (
            <div key={pid} className="relative w-16 h-20 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cloudinaryUrl(pid, "w_120,c_fill,q_auto")}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemoveFromSlot(activeSlot, pid)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/80 text-white text-[10px] flex items-center justify-center hover:bg-red-900 transition-colors"
                title="Odebrat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {activeSlot !== null && (
        <p className="text-xs text-zinc-500 mb-3">
          Klikni na fotky níže pro přidání/odebrání ze slotu {activeSlot + 1}.
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveTriptych}
          disabled={triptychSaving}
          className="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {triptychSaving ? "Ukládám…" : "Uložit triptych"}
        </button>
        {triptychMsg && (
          <span className={`text-sm ${triptychMsg.ok ? "text-green-400" : "text-red-400"}`}>
            {triptychMsg.text}
          </span>
        )}
      </div>
    </section>
  );
}
