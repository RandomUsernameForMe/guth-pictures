"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultColors, type ColorSet, type ThemeColors } from "@/lib/theme-types";

type Mode = "dark" | "light";

const COLOR_FIELDS: { key: keyof ColorSet; label: string }[] = [
  { key: "bg",          label: "Pozadí" },
  { key: "bgElevated",  label: "Pozadí vyvýšené" },
  { key: "bgOverlay",   label: "Pozadí overlay" },
  { key: "surface",     label: "Surface" },
  { key: "text",        label: "Text" },
  { key: "textMuted",   label: "Text muted" },
  { key: "textGhost",   label: "Text ghost" },
  { key: "accent",      label: "Akcent" },
  { key: "accentHover", label: "Akcent hover" },
];

const CSS_VAR_MAP: Record<keyof ColorSet, string> = {
  bg:          "--color-bg",
  bgElevated:  "--color-bg-elevated",
  bgOverlay:   "--color-bg-overlay",
  surface:     "--color-surface",
  text:        "--color-text",
  textMuted:   "--color-text-muted",
  textGhost:   "--color-text-ghost",
  accent:      "--color-accent",
  accentHover: "--color-accent-hover",
};

export function ThemeEditor() {
  const router = useRouter();
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((r) => r.json())
      .then((data) => setColors(data))
      .catch(() => {});
  }, []);

  function updateColor(mode: Mode, key: keyof ColorSet, value: string) {
    setColors((prev) => ({ ...prev, [mode]: { ...prev[mode], [key]: value } }));

    // Live preview: update CSS var on the document root and .dark/.light element
    const cssVar = CSS_VAR_MAP[key];
    document.documentElement.style.setProperty(cssVar, value);
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
    await fetch("/api/admin/theme", { method: "DELETE" });
    setColors(defaultColors);
    // Clear inline overrides
    for (const cssVar of Object.values(CSS_VAR_MAP)) {
      document.documentElement.style.removeProperty(cssVar);
    }
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  }

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(["dark", "light"] as Mode[]).map((mode) => (
          <div key={mode}>
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
              {mode === "dark" ? "Tmavý motiv" : "Světlý motiv"}
            </h3>
            <div className="space-y-3">
              {COLOR_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors[mode][key]}
                    onChange={(e) => updateColor(mode, key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
                  />
                  <input
                    type="text"
                    value={colors[mode][key]}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateColor(mode, key, v);
                    }}
                    className="w-24 px-2 py-1 text-sm font-mono bg-zinc-900 border border-white/10 focus:border-white/30 outline-none"
                  />
                  <span className="text-sm text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Previews */}
      <div className="mt-10">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Náhled</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(["dark", "light"] as Mode[]).map((mode) => {
            const c = colors[mode];
            return (
              <div key={mode} style={{ backgroundColor: c.bg, color: c.text }} className="rounded p-5 space-y-4">
                <p className="text-xs font-medium uppercase tracking-widest opacity-40" style={{ color: c.text }}>
                  {mode === "dark" ? "Tmavý" : "Světlý"}
                </p>

                {/* Hlavní text */}
                <div>
                  <p style={{ color: c.text }} className="text-base font-semibold">Nadpis stránky</p>
                  <p style={{ color: c.textMuted }} className="text-sm mt-0.5">Popisný text, doplňující info.</p>
                  <p style={{ color: c.textGhost }} className="text-xs mt-0.5">Ghost text / placeholder</p>
                </div>

                {/* Elevated bg */}
                <div style={{ backgroundColor: c.bgElevated }} className="rounded p-3">
                  <p style={{ color: c.text }} className="text-sm font-medium">Elevated karta</p>
                  <p style={{ color: c.textMuted }} className="text-xs mt-0.5">Text na vyvýšeném pozadí</p>
                </div>

                {/* Surface */}
                <div style={{ backgroundColor: c.surface }} className="rounded p-3">
                  <p style={{ color: c.text }} className="text-sm font-medium">Surface</p>
                  <p style={{ color: c.textGhost }} className="text-xs mt-0.5">Ghost text na surface</p>
                </div>

                {/* Overlay */}
                <div style={{ backgroundColor: c.bgOverlay }} className="rounded p-3">
                  <p style={{ color: c.text }} className="text-sm font-medium">Overlay</p>
                  <p style={{ color: c.textMuted }} className="text-xs mt-0.5">Muted text na overlay</p>
                </div>

                {/* Accent tlačítko */}
                <div className="flex gap-2 items-center">
                  <span
                    style={{ backgroundColor: c.accent, color: c.bg }}
                    className="px-4 py-1.5 text-sm font-medium rounded"
                  >
                    Akcent button
                  </span>
                  <span
                    style={{ backgroundColor: c.accentHover, color: c.bg }}
                    className="px-4 py-1.5 text-sm font-medium rounded"
                  >
                    Hover
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
