"use client";

import { useEffect, useState } from "react";

export function ctaVisible({ heroVisible, contactVisible }: { heroVisible: boolean; contactVisible: boolean }): boolean {
  return !heroVisible && !contactVisible;
}

function useElementInView(id: string, initial: boolean): boolean {
  const [inView, setInView] = useState(initial);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [id]);
  return inView;
}

export function StickyContactCta({ label }: { label: string }) {
  const heroVisible = useElementInView("hero", true);
  const contactVisible = useElementInView("kontakt", false);
  const visible = ctaVisible({ heroVisible, contactVisible });

  return (
    <a
      href="#kontakt"
      aria-label={label}
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 49,
        padding: "12px 20px",
        background: "var(--color-text)",
        color: "var(--color-bg)",
        fontSize: 14,
        fontWeight: 500,
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s",
      }}
    >
      {label} →
    </a>
  );
}
