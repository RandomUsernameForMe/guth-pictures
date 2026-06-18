"use client";

import { createContext, useContext, useMemo, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { paletteToTheme } from "@/modules/brand-shoot/lib/palette-theme";
import type { ProposalPalette } from "@/modules/brand-shoot/lib/types";

// Theme state shared between the wrapper (applies the CSS vars) and the per-concept palette
// toggles (live inside each approach block). Selecting a palette anywhere recolors the whole page.
type ThemeCtx = { activeId: string | null; select: (id: string, colors: string[]) => void };
const ThemeContext = createContext<ThemeCtx>({ activeId: null, select: () => {} });

// Wraps the client proposal in `.bsp`, applying the active palette as --bsp-* CSS vars
// (semantic roles + raw --bsp-c1..cN for decorative shapes). Server-rendered children inherit
// the vars via cascade; global theme transitions animate the recolor. Palettes belong to
// approaches now — the toggle UI lives in each concept block (see ConceptPaletteToggle).
export function ProposalThemer({
  initialId,
  initialColors,
  children,
}: {
  initialId: string | null;
  initialColors: string[];
  children: React.ReactNode;
}) {
  const [active, setActive] = useState<{ id: string | null; colors: string[] }>({
    id: initialId,
    colors: initialColors,
  });

  const style = useMemo(() => {
    const s: Record<string, string> = { ...paletteToTheme(active.colors) };
    active.colors.slice(0, 6).forEach((c, i) => {
      s[`--bsp-c${i + 1}`] = c;
    });
    return s;
  }, [active.colors]);

  const ctx = useMemo<ThemeCtx>(
    () => ({ activeId: active.id, select: (id, colors) => setActive({ id, colors }) }),
    [active.id]
  );

  return (
    <ThemeContext.Provider value={ctx}>
      <main className="bsp" style={style as CSSProperties}>
        <div className="bsp-decor" aria-hidden />
        {children}
      </main>
    </ThemeContext.Provider>
  );
}

// Palette toggle for a single approach. Swatch-only chips (names stay internal); selecting one
// themes the whole page. Renders nothing for a single palette (nothing to toggle).
export function ConceptPaletteToggle({ palettes }: { palettes: ProposalPalette[] }) {
  const t = useTranslations("brand-shoot");
  const { activeId, select } = useContext(ThemeContext);
  if (!palettes || palettes.length === 0) return null;

  return (
    <div className="bsp-palette-toggle" role="group" aria-label={t("paletteToggleLabel")}>
      <span className="bsp-palette-toggle-label gp-label">{t("paletteToggleLabel")}</span>
      {palettes.map((p, i) => (
        <button
          key={p.id}
          type="button"
          className={`bsp-swatch-chip${p.id === activeId ? " is-active" : ""}`}
          aria-pressed={p.id === activeId}
          onClick={() => select(p.id, p.colors)}
          aria-label={`${t("paletteToggleLabel")} ${i + 1}`}
        >
          <span className="bsp-chip-swatches" aria-hidden>
            {p.colors.slice(0, 5).map((c, j) => (
              <span key={j} style={{ background: c }} />
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}
