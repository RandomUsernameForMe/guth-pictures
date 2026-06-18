"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { paletteToTheme } from "@/modules/brand-shoot/lib/palette-theme";
import type { ProposalPalette } from "@/modules/brand-shoot/lib/types";

// Wraps the client proposal in `.bsp`, applying the selected palette as --bsp-* CSS vars
// (semantic roles + raw --bsp-c1..cN for decorative shapes). Server-rendered children inherit
// the vars via cascade; global theme transitions animate the recolor. Renders large decorative
// palette-colored blobs + a palette band, and a swatch toggle when ≥2 palettes are approved.
export function ProposalThemer({
  palettes,
  children,
}: {
  palettes: ProposalPalette[];
  children: React.ReactNode;
}) {
  const t = useTranslations("brand-shoot");
  const [active, setActive] = useState(0);

  const colors = palettes[active]?.colors ?? [];
  const style: Record<string, string> = { ...paletteToTheme(colors) };
  colors.slice(0, 6).forEach((c, i) => {
    style[`--bsp-c${i + 1}`] = c;
  });

  return (
    <main className="bsp" style={style as CSSProperties}>
      <div className="bsp-decor" aria-hidden />

      {palettes.length > 0 && (
        <div className="bsp-band" aria-hidden>
          {colors.map((c, i) => (
            <span key={i} style={{ background: c }} />
          ))}
        </div>
      )}

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
