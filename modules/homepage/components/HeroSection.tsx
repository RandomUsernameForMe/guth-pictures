"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type HeroPhoto = {
  publicId: string;
  category: "portraits" | "events";
};

type Props = {
  title: string;
  subtitle: string;
  ctaPortfolio: string;
  ctaContact: string;
  /** Three photos for the triptych — one per panel. Falls back to a
   *  plain dark surface if not provided. */
  photos?: [HeroPhoto, HeroPhoto, HeroPhoto];
  locale: string;
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Filmic warm/cool tint overlay, multiply blend */
function FilmicTint() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,20,40,0.18) 0%, rgba(0,0,0,0) 40%, rgba(90,48,25,0.10) 100%)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

/** Subtle film-grain texture */
function Grain() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 9998,
        opacity: 0.038,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
      }}
    />
  );
}

/** One triptych panel. Fades between `images` on an interval. */
function TriptychPanel({
  images,
  interval = 5000,
  kbAnimation,
  label,
  index,
}: {
  images: string[];
  interval?: number;
  kbAnimation: string;
  label: string;
  index: number;
}) {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setCur((c) => (c + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  const prev = (cur + images.length - 1) % images.length;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--color-surface)",
        borderLeft: index > 0 ? "1px solid rgba(0,0,0,0.45)" : "none",
      }}
    >
      {/* Outgoing image */}
      <img
        src={images[prev]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: kbAnimation }}
        aria-hidden
      />
      {/* Incoming image — fades in */}
      <img
        key={cur}
        src={images[cur]}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ animation: `${kbAnimation}, heroFadeIn 1.6s ease-out` }}
        aria-hidden
      />
      <FilmicTint />
      {/* Category label */}
      <div
        className="absolute top-20 left-5 flex items-center gap-2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        <span>{String(index + 1).padStart(3, "0")}</span>
        <span style={{ width: 14, height: 1, background: "rgba(255,255,255,0.3)", display: "block" }} />
        <span>{label}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export function HeroSection({ title, subtitle, ctaPortfolio, ctaContact, photos, locale }: Props) {
  // Scroll progress over the first 160px of page scroll (0 → 1)
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => setProgress(Math.min(1, window.scrollY / 160));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Eased progress (ease-in-out quad)
  const ease = progress < 0.5
    ? 2 * progress * progress
    : -1 + (4 - 2 * progress) * progress;

  // Derived values
  const navBgAlpha = ease * 0.72;
  const navBorderAlpha = ease * 0.08;
  const navBlur = ease * 14;
  const bandY = ease * -24;
  const bandOpacity = 1 - ease * 0.45;
  const eyebrowOpacity = Math.max(0, 1 - ease * 2.5);
  const bandLinksOpacity = Math.max(0, 1 - ease * 2.2);
  const navItemsOpacity = ease;
  const navItemsY = (1 - ease) * -10;
  const scrollHintOpacity = Math.max(0, 1 - ease * 3);

  // Build image URL arrays per panel.
  // panels[0] = portraits, panels[1] = events, panels[2] = portraits (mix)
  // If no photos provided, panels are empty (surface colour shows).
  const buildSrcs = (category: "portraits" | "events") =>
    (photos ?? [])
      .filter((p) => p.category === category)
      .map((p) => cloudinaryUrl(p.publicId, "w_800,c_fill,q_auto:good,f_auto"));

  const panelData: { srcs: string[]; label: string; kb: string }[] = [
    {
      srcs: buildSrcs("portraits"),
      label: locale === "cs" ? "Portréty" : "Portraits",
      kb: "heroKb1 18s ease-in-out infinite alternate",
    },
    {
      srcs: buildSrcs("events"),
      label: locale === "cs" ? "Eventy" : "Events",
      kb: "heroKb2 22s ease-in-out infinite alternate",
    },
    {
      srcs: [...buildSrcs("portraits")].reverse(),
      label: locale === "cs" ? "Portréty" : "Portraits",
      kb: "heroKb3 16s ease-in-out infinite alternate",
    },
  ];

  const navLinks: { label: string; href: string }[] =
    locale === "cs"
      ? [
          { label: "Portfolio", href: "/portfolio" },
          { label: "O mně", href: "#o-mne" },
          { label: "Služby", href: "#sluzby" },
          { label: "Kontakt", href: "#kontakt" },
        ]
      : [
          { label: "Portfolio", href: "/portfolio" },
          { label: "About", href: "#o-mne" },
          { label: "Services", href: "#sluzby" },
          { label: "Contact", href: "#kontakt" },
        ];

  return (
    <>
      {/* Global keyframes — injected once */}
      <style>{`
        @keyframes heroKb1 {
          from { transform: scale(1.02) translate(0,0); }
          to   { transform: scale(1.10) translate(-1.5%,-1%); }
        }
        @keyframes heroKb2 {
          from { transform: scale(1.06) translate(0.5%,0); }
          to   { transform: scale(1.02) translate(-0.5%,0.8%); }
        }
        @keyframes heroKb3 {
          from { transform: scale(1.04) translate(0,0); }
          to   { transform: scale(1.10) translate(1%,-1%); }
        }
        @keyframes heroFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* ── Glass navbar — emerges on scroll ── */}
      <div
        className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-10"
        style={{
          zIndex: 50,
          background: `rgba(10,10,11,${navBgAlpha.toFixed(3)})`,
          backdropFilter: `blur(${navBlur.toFixed(1)}px)`,
          WebkitBackdropFilter: `blur(${navBlur.toFixed(1)}px)`,
          borderBottom: `1px solid rgba(255,255,255,${navBorderAlpha.toFixed(3)})`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-text)",
            opacity: navItemsOpacity,
            transform: `translateY(${(1 - ease) * -8}px)`,
          }}
        >
          {title}
        </div>

        {/* Links */}
        <div
          className="flex items-center gap-7"
          style={{
            opacity: navItemsOpacity,
            transform: `translateY(${navItemsY.toFixed(1)}px)`,
          }}
        >
          {navLinks.map(({ label, href }) =>
            href.startsWith("#") ? (
              <a
                key={href}
                href={href}
                className="text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200"
              >
                {label}
              </a>
            ) : (
              <Link
                key={href}
                href={href}
                className="text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200"
              >
                {label}
              </Link>
            )
          )}
          <span
            className="ml-2 flex items-center gap-1"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" }}
          >
            <Link href="/" locale="cs" style={{ color: locale === "cs" ? "var(--color-text)" : "var(--color-text-ghost)" }}>CS</Link>
            <span style={{ color: "var(--color-text-ghost)" }}>/</span>
            <Link href="/" locale="en" style={{ color: locale === "en" ? "var(--color-text)" : "var(--color-text-ghost)" }}>EN</Link>
          </span>
        </div>
      </div>

      {/* ── Hero section ── */}
      <section
        id="hero"
        className="relative h-screen flex items-stretch overflow-hidden"
        aria-label={locale === "cs" ? "Úvodní sekce" : "Hero section"}
      >
        {/* Triptych */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {panelData.map((p, i) => (
            <TriptychPanel
              key={i}
              images={p.srcs}
              kbAnimation={p.kb}
              label={p.label}
              index={i}
              interval={4800 + i * 600}
            />
          ))}
        </div>

        {/* Overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,10,11,0.20) 0%, rgba(10,10,11,0.70) 100%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(10,10,11,0.85) 0%, transparent 40%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(10,10,11,0.40) 0%, transparent 28%)" }}
        />

        {/* ── Centred composition — dissolves into navbar on scroll ── */}
        <div
          className="relative z-10 w-full flex flex-col items-center justify-center"
          style={{
            transform: `translateY(${bandY.toFixed(1)}px)`,
            opacity: bandOpacity,
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color: "rgba(242,240,235,0.50)",
              marginBottom: 22,
              opacity: eyebrowOpacity,
            }}
          >
            {locale === "cs" ? "Jakub Guth · Praha" : "Jakub Guth · Prague"}
          </div>

          {/* Wordmark */}
          <h1
            className="font-bold text-[var(--color-text)] text-center"
            style={{
              margin: 0,
              letterSpacing: "-0.04em",
              lineHeight: 0.88,
              fontSize: "clamp(80px, 10vw, 140px)",
              textShadow: "0 2px 40px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </h1>

          {/* Rule */}
          <div
            style={{
              width: 40,
              height: 1,
              background: "rgba(255,255,255,0.22)",
              margin: "28px 0",
            }}
          />

          {/* Subtitle */}
          <p
            className="text-[var(--color-text-muted)] text-center"
            style={{ margin: 0, fontSize: 16, letterSpacing: "0.02em" }}
          >
            {subtitle}
          </p>

          {/* CTAs */}
          <div className="mt-7 flex gap-3 flex-wrap justify-center">
            <a
              href="#kontakt"
              className="px-7 py-3.5 bg-[var(--color-text)] text-[var(--color-bg)] font-medium text-sm rounded-xl hover:opacity-90 transition-opacity duration-200 inline-flex items-center gap-2"
            >
              {ctaContact} <span>→</span>
            </a>
            <Link
              href="/portfolio"
              className="px-7 py-3.5 border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-xl hover:bg-[var(--color-bg-overlay)] transition-all duration-200 inline-flex items-center gap-2"
              style={{ background: "rgba(10,10,11,0.45)", backdropFilter: "blur(8px)" }}
            >
              {ctaPortfolio}
            </Link>
          </div>

          {/* Nav links in band — fade out as navbar takes over */}
          <div
            className="mt-9 flex gap-8"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "rgba(242,240,235,0.55)",
              letterSpacing: "0.04em",
              opacity: bandLinksOpacity,
              transform: `translateY(${(ease * -6).toFixed(1)}px)`,
            }}
          >
            {navLinks.map(({ label, href }) =>
              href.startsWith("#") ? (
                <a
                  key={href}
                  href={href}
                  className="hover:text-[var(--color-text)] transition-colors duration-200"
                  style={{ color: "rgba(242,240,235,0.55)" }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className="hover:text-[var(--color-text)] transition-colors duration-200"
                  style={{ color: "rgba(242,240,235,0.55)" }}
                >
                  {label}
                </Link>
              )
            )}
            <span
              className="flex items-center gap-1"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em" }}
            >
              <Link href="/" locale="cs" style={{ color: locale === "cs" ? "rgba(242,240,235,0.7)" : "rgba(242,240,235,0.35)" }}>CS</Link>
              <span style={{ color: "rgba(242,240,235,0.25)" }}>/</span>
              <Link href="/" locale="en" style={{ color: locale === "en" ? "rgba(242,240,235,0.7)" : "rgba(242,240,235,0.35)" }}>EN</Link>
            </span>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "rgba(242,240,235,0.35)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: scrollHintOpacity,
          }}
        >
          <span style={{ width: 20, height: 1, background: "rgba(242,240,235,0.25)", display: "block" }} />
          <span>{locale === "cs" ? "Scroll" : "Scroll"}</span>
          <span style={{ width: 20, height: 1, background: "rgba(242,240,235,0.25)", display: "block" }} />
        </div>

        {/* Scroll progress line — brass accent */}
        {progress > 0 && (
          <div
            className="fixed top-[63px] left-0 h-px z-50 pointer-events-none"
            style={{
              width: `${progress * 100}%`,
              background: "rgba(200,169,110,0.4)",
            }}
          />
        )}
      </section>

      <Grain />
    </>
  );
}
