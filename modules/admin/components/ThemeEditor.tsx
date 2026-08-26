"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CSS_VAR_MAP, COLOR_KEYS, type ColorSet } from "@/lib/theme-types";
import { themePresets, defaultColors } from "@/lib/theme-presets";

const LABELS: Record<keyof ColorSet, string> = {
  bg:              "Pozadí",
  bgElevated:      "Pozadí vyvýšené",
  bgOverlay:       "Pozadí overlay",
  surface:         "Surface",
  text:            "Text",
  textMuted:       "Text muted",
  textGhost:       "Text ghost",
  accent:          "Akcent (výplně, CTA)",
  accentHover:     "Akcent hover",
  accentSecondary: "Druhý akcent (linky, rámečky)",
  grain:           "Grain (zrno přes stránku)",
};

export function ThemeEditor() {
  const router = useRouter();
  const [colors, setColors] = useState<ColorSet>(defaultColors);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((data) => setColors(data))
      .catch(() => {});
  }, []);

  function updateColor(key: keyof ColorSet, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
    // Live preview: override the CSS var on the document root
    document.documentElement.style.setProperty(CSS_VAR_MAP[key], value);
  }

  function applyPreset(preset: ColorSet) {
    setColors(preset);
    for (const key of COLOR_KEYS) {
      document.documentElement.style.setProperty(CSS_VAR_MAP[key], preset[key]);
    }
  }

  async function save() {
    setStatus("saving");
    try {
      const r = await fetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });
      if (!r.ok) throw new Error();
      setStatus("ok");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  async function reset() {
    try {
      const r = await fetch("/api/admin/theme", { method: "DELETE" });
      if (!r.ok) throw new Error();
      applyPreset(defaultColors);
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }

  const activePresetId = themePresets.find((p) =>
    COLOR_KEYS.every((k) => p.colors[k].toLowerCase() === colors[k].toLowerCase()),
  )?.id;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Barvy motivu</h2>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="px-3 py-1.5 text-sm border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
          >
            Reset na default
          </button>
          <button
            onClick={save}
            disabled={status === "saving"}
            className="px-4 py-1.5 text-sm bg-white text-black hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {status === "saving" ? "Ukládám…" : status === "ok" ? "Uloženo" : status === "error" ? "Chyba" : "Uložit"}
          </button>
        </div>
      </div>

      {/* Presety */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Presety</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {themePresets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.colors)}
              className={`text-left rounded border p-3 transition-colors ${
                activePresetId === p.id
                  ? "border-white/40 bg-white/5"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <div className="flex rounded overflow-hidden mb-2">
                {([p.colors.bg, p.colors.surface, p.colors.accent, p.colors.accentSecondary] as const).map((c, i) => (
                  <span key={i} className="flex-1 h-7" style={{ backgroundColor: c }} />
                ))}
              </div>
              <p className="text-sm font-medium">{p.label}</p>
              {p.note && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{p.note}</p>}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Kliknutí jen nastaví barvy v editoru — projeví se až po uložení.
        </p>
      </div>

      {/* Jednotlivé barvy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {COLOR_KEYS.map((key) => (
          <div key={key} className="flex items-center gap-3">
            <input
              type="color"
              value={colors[key]}
              onChange={(e) => updateColor(key, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
            />
            <input
              type="text"
              value={colors[key]}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateColor(key, v);
              }}
              className="w-24 px-2 py-1 text-sm font-mono bg-zinc-900 border border-white/10 focus:border-white/30 outline-none"
            />
            <span className="text-sm text-gray-400">{LABELS[key]}</span>
          </div>
        ))}
      </div>

      {/* Náhled */}
      <div className="mt-10">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Náhled</h3>
        <div
          style={{ backgroundColor: colors.bg, color: colors.text }}
          className="relative rounded p-5 space-y-4 overflow-hidden max-w-lg"
        >
          {/* Grain — stejný overlay jako na webu */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.055,
              backgroundColor: colors.grain,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
              backgroundBlendMode: "color",
              backgroundSize: "200px 200px",
            }}
          />

          <div className="relative">
            <span
              className="inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm"
              style={{ color: colors.accentSecondary, border: `1px solid ${colors.accentSecondary}73` }}
            >
              Brand focení
            </span>
            <p className="text-base font-semibold mt-2">Nadpis stránky</p>
            <span className="block h-px w-9 my-2" style={{ backgroundColor: colors.accentSecondary }} />
            <p style={{ color: colors.textMuted }} className="text-sm">Popisný text, doplňující info.</p>
            <p style={{ color: colors.textGhost }} className="text-xs mt-0.5">Ghost text / placeholder</p>
          </div>

          <div style={{ backgroundColor: colors.bgElevated }} className="relative rounded p-3">
            <p className="text-sm font-medium">Elevated karta</p>
            <p style={{ color: colors.textMuted }} className="text-xs mt-0.5">Text na vyvýšeném pozadí</p>
          </div>

          <div
            style={{ backgroundColor: colors.surface, borderLeft: `2px solid ${colors.accentSecondary}` }}
            className="relative rounded p-3"
          >
            <p className="text-sm font-medium">Surface</p>
            <p style={{ color: colors.textGhost }} className="text-xs mt-0.5">Ghost text na surface</p>
          </div>

          <div style={{ backgroundColor: colors.bgOverlay }} className="relative rounded p-3">
            <p className="text-sm font-medium">Overlay</p>
            <p style={{ color: colors.textMuted }} className="text-xs mt-0.5">Muted text na overlay</p>
          </div>

          <div className="relative flex gap-2 items-center">
            <span style={{ backgroundColor: colors.accent, color: colors.bg }} className="px-4 py-1.5 text-sm font-medium rounded-full">
              Akcent button
            </span>
            <span style={{ backgroundColor: colors.accentHover, color: colors.bg }} className="px-4 py-1.5 text-sm font-medium rounded-full">
              Hover
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
