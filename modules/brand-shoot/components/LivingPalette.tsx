"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Client shell for the Editorial proposal. Renders the ambient glow + fixed chrome and installs
// the "living palette" behaviour by reading `data-pal-*` attrs off the server-rendered sections:
// a scroll-spy recolors `--p-*` to whichever section sits at viewport-mid. Each concept carries its
// single admin-chosen palette, so there's no client palette switching — just the auto recolor.
export function LivingPalette({
  initial,
  resetLabel,
  children,
}: {
  initial: { accent: string; glowA: string; glowB: string; tint: string; duoShadow: string; duoLight: string };
  resetLabel: string;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function setPalette(ds: DOMStringMap) {
      // Set vars on the .bsp-ed root itself — NOT documentElement. The root carries inline
      // --p-* defaults, and a nearer ancestor's custom property shadows :root for its subtree,
      // so writing to documentElement would never take effect inside .bsp-ed.
      const s = root!.style;
      if (ds.palAccent) s.setProperty("--p-accent", ds.palAccent);
      if (ds.palGlowa) s.setProperty("--p-glow-a", ds.palGlowa);
      if (ds.palGlowb) s.setProperty("--p-glow-b", ds.palGlowb);
      if (ds.palTint) s.setProperty("--p-tint", ds.palTint);
      if (ds.palDuoa) s.setProperty("--bsp-duo-shadow", ds.palDuoa);
      if (ds.palDuob) s.setProperty("--bsp-duo-light", ds.palDuob);
      // Palette names stay internal — show swatches only. Colors are our own server-derived
      // hexes (data-pal-sw), not user input.
      const colors = (ds.palSw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      root!.querySelectorAll<HTMLElement>("[data-pal-swatches]").forEach((sw) => {
        sw.replaceChildren(
          ...colors.map((c) => {
            const el = document.createElement("span");
            el.style.cssText = `display:block;width:14px;height:14px;background:${c}`;
            return el;
          })
        );
      });
    }

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-pal]"));
    function pickNow() {
      const mid = window.innerHeight / 2;
      if (!sections.length) return;
      let pick: HTMLElement | null = null;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          pick = s;
          break;
        }
      }
      if (!pick) {
        pick = sections.reduce((best, s) => {
          const c = s.getBoundingClientRect();
          const bc = best.getBoundingClientRect();
          return Math.abs((c.top + c.bottom) / 2 - mid) < Math.abs((bc.top + bc.bottom) / 2 - mid) ? s : best;
        }, sections[0]);
      }
      if (pick) setPalette(pick.dataset);
    }

    let lastT = 0;
    function onScroll() {
      const t = Date.now();
      if (t - lastT < 80) return;
      lastT = t;
      pickNow();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    const iv = window.setInterval(pickNow, 220);

    pickNow();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(iv);
    };
  }, []);

  const style = {
    "--p-accent": initial.accent,
    "--p-glow-a": initial.glowA,
    "--p-glow-b": initial.glowB,
    "--p-tint": initial.tint,
    "--bsp-duo-shadow": initial.duoShadow,
    "--bsp-duo-light": initial.duoLight,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="bsp-ed" data-bsp-root style={style}>
      <div className="bsp-ed-glow" aria-hidden />
      <div className="bsp-ed-content">{children}</div>

      {/* fixed chrome */}
      <div className="bsp-ed-progress" aria-hidden />
      <div className="bsp-ed-grain" aria-hidden />
      <div className="bsp-ed-indicator" data-pal-indicator>
        <span className="bsp-ed-ind-label gp-label">{resetLabel}</span>
        <span data-pal-swatches className="bsp-ed-ind-sw" />
      </div>
    </div>
  );
}
