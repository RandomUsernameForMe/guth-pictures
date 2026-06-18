"use client";

import { useEffect, useRef, type CSSProperties } from "react";

// Client shell for the Editorial proposal. Renders the ambient glow + fixed chrome and installs
// the "living palette" behaviour by reading `data-pal-*` attrs off the server-rendered sections:
// a scroll-spy recolors `--p-*` to whichever section sits at viewport-mid, and the per-concept
// "select" buttons lock a palette (ported from the standalone's vanilla script via DOM delegation,
// so the sections themselves stay server components).
export function LivingPalette({
  initial,
  resetLabel,
  children,
}: {
  initial: { accent: string; glowA: string; glowB: string; tint: string };
  resetLabel: string;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const docEl = document.documentElement;
    const root = rootRef.current;
    if (!root) return;
    let locked: DOMStringMap | null = null;

    function setPalette(ds: DOMStringMap) {
      if (ds.palAccent) docEl.style.setProperty("--p-accent", ds.palAccent);
      if (ds.palGlowa) docEl.style.setProperty("--p-glow-a", ds.palGlowa);
      if (ds.palGlowb) docEl.style.setProperty("--p-glow-b", ds.palGlowb);
      if (ds.palTint) docEl.style.setProperty("--p-tint", ds.palTint);
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
      if (locked) return;
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

    const btns = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-select]"));
    const reset = root.querySelector<HTMLElement>("[data-reset-pal]");
    function clearBtns() {
      btns.forEach((x) => {
        x.dataset.active = "false";
      });
    }
    const onBtn = (b: HTMLButtonElement) => () => {
      const ds = b.dataset;
      locked = ds;
      setPalette(ds);
      clearBtns();
      b.dataset.active = "true";
      if (reset) reset.style.display = "inline";
    };
    const handlers = btns.map((b) => {
      const h = onBtn(b);
      b.addEventListener("click", h);
      return [b, h] as const;
    });
    const onReset = (e: Event) => {
      e.preventDefault();
      locked = null;
      clearBtns();
      if (reset) reset.style.display = "none";
      pickNow();
    };
    reset?.addEventListener("click", onReset);

    pickNow();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearInterval(iv);
      handlers.forEach(([b, h]) => b.removeEventListener("click", h));
      reset?.removeEventListener("click", onReset);
    };
  }, []);

  const style = {
    "--p-accent": initial.accent,
    "--p-glow-a": initial.glowA,
    "--p-glow-b": initial.glowB,
    "--p-tint": initial.tint,
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
