"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { paletteToTheme } from "@/modules/brand-shoot/lib/palette-theme";
import type { ProposalPalette } from "@/modules/brand-shoot/lib/types";

// Wraps the client proposal in `.bsp`, applying the selected palette as --bsp-* CSS vars.
// Server-rendered children inherit the vars via normal cascade; the global theme transition
// (@layer base) animates the recolor. Renders a palette toggle when ≥2 palettes are approved.
export function ProposalThemer({
  palettes,
  children,
}: {
  palettes: ProposalPalette[];
  children: React.ReactNode;
}) {
  const t = useTranslations("brand-shoot");
  const [active, setActive] = useState(0);
  const themed = palettes.length ? paletteToTheme(palettes[active]?.colors ?? []) : {};

  return (
    <main className="bsp" style={themed as CSSProperties}>
      {palettes.length >= 2 && (
        <div className="bsp-palette-toggle" role="group" aria-label={t("paletteToggleLabel")}>
          <span className="bsp-palette-toggle-label gp-label">{t("paletteToggleLabel")}</span>
          {palettes.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`bsp-swatch-chip${i === active ? " is-active" : ""}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              title={p.name}
            >
              <span className="bsp-chip-swatches" aria-hidden>
                {p.colors.slice(0, 5).map((c, j) => (
                  <span key={j} style={{ background: c }} />
                ))}
              </span>
              <span className="bsp-chip-name">{p.name}</span>
            </button>
          ))}
        </div>
      )}
      {children}
    </main>
  );
}
