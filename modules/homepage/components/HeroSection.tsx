"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";

type Props = {
  title: string;
  subtitle: string;
  ctaPortfolio: string;
  ctaContact: string;
  photos?: [string[], string[], string[]];
  locale: string;
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function FilmicTint() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{
        background: "linear-gradient(180deg, rgba(10,20,40,0.18) 0%, rgba(0,0,0,0) 40%, rgba(90,48,25,0.10) 100%)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

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

function TriptychPanel({
  images, interval = 5000, kbAnimation, label, index,
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
      style={{ background: "var(--color-surface)", borderLeft: index > 0 ? "1px solid rgba(0,0,0,0.45)" : "none" }}
    >
      <img src={images[prev]} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ animation: kbAnimation }} loading="eager" aria-hidden />
      <img key={cur} src={images[cur]} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ animation: `${kbAnimation}, heroFadeIn 1.6s ease-out` }} loading="eager" fetchPriority={index === 0 ? "high" : "auto"} aria-hidden />
      <FilmicTint />
      <div
        className="absolute top-20 left-5 flex items-center gap-2"
        style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.22em", textTransform: "uppercase" }}
      >
        <span>{String(index + 1).padStart(3, "0")}</span>
        <span style={{ width: 14, height: 1, background: "rgba(255,255,255,0.3)", display: "block" }} />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function HeroSection({ title, subtitle, ctaPortfolio, ctaContact, photos, locale }: Props) {
  const [progress, setProgress] = useState(0);
  const [vh, setVh] = useState(800);

  useEffect(() => {
    setVh(window.innerHeight);
    const onScroll = () => setProgress(Math.min(1, window.scrollY / 280));
    const onResize = () => setVh(window.innerHeight);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const ease = progress < 0.5
    ? 2 * progress * progress
    : -1 + (4 - 2 * progress) * progress;

  // ── Morphing pill ───────────────────────────────────────────
  const BAND_H = 44;
  const NAV_H = 64;
  const navH = lerp(BAND_H, NAV_H, ease);
  const navTranslateY = (1 - ease) * (vh * 0.69 - navH / 2);
  const navSide = lerp(22, 0, ease);
  const navBR = lerp(22, 0, ease);
  const navBgAlpha = lerp(0.32, 0.72, ease);
  const navBlur = lerp(8, 16, ease);
  const navBorderAlpha = lerp(0.08, 0.12, ease);

  // ── Pill content: crossfade same links between centered → right-aligned
  const bandOpacity  = Math.max(0, 1 - ease / 0.6);
  const navbarOpacity = Math.max(0, (ease - 0.4) / 0.6);

  // ── Hero content
  const heroContentOpacity = Math.max(0, 1 - ease / 0.45);
  const heroContentY = ease * -28;
  const scrollHintOpacity = Math.max(0, 1 - ease * 4);

  const navLinks: { label: string; href: string }[] = locale === "cs"
    ? [
        { label: "Portfolio", href: "/portfolio" },
        { label: "O mně",     href: "#o-mne" },
        { label: "Služby",    href: "#sluzby" },
        { label: "Kontakt",   href: "#kontakt" },
      ]
    : [
        { label: "Portfolio", href: "/portfolio" },
        { label: "About",     href: "#o-mne" },
        { label: "Services",  href: "#sluzby" },
        { label: "Contact",   href: "#kontakt" },
      ];

  const toSrcs = (ids: string[]) => ids.map((id) => cloudinaryUrl(id, "w_800,c_fill,q_auto:good,f_auto"));
  const panelLabels = locale === "cs" ? ["Portréty", "Eventy", "Larpy"] : ["Portraits", "Events", "Larps"];
  const panelData = [
    { srcs: toSrcs(photos?.[0] ?? []), label: panelLabels[0], kb: "heroKb1 18s ease-in-out infinite alternate" },
    { srcs: toSrcs(photos?.[1] ?? []), label: panelLabels[1], kb: "heroKb2 22s ease-in-out infinite alternate" },
    { srcs: toSrcs(photos?.[2] ?? []), label: panelLabels[2], kb: "heroKb3 16s ease-in-out infinite alternate" },
  ];

  return (
    <>
      <style>{`
        @keyframes heroKb1 { from { transform: scale(1.02) translate(0,0); }    to { transform: scale(1.10) translate(-1.5%,-1%); } }
        @keyframes heroKb2 { from { transform: scale(1.06) translate(0.5%,0); } to { transform: scale(1.02) translate(-0.5%,0.8%); } }
        @keyframes heroKb3 { from { transform: scale(1.04) translate(0,0); }    to { transform: scale(1.10) translate(1%,-1%); } }
        @keyframes heroFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Scroll progress line — top of viewport ─────────── */}
      {progress > 0 && (
        <div
          className="fixed top-0 left-0 h-px z-[60] pointer-events-none"
          style={{ width: `${progress * 100}%`, background: "rgba(200,169,110,0.5)" }}
        />
      )}

      {/* ── Morphing pill → navbar ───────────────────────────── */}
      {/*
        Single set of links — always right-aligned.
        Logo fades in on left as pill grows into navbar.
        Same elements move with the pill, no crossfade swap.
      */}
      <div
        style={{
          position: "fixed",
          zIndex: 50,
          top: 0,
          left: `${navSide.toFixed(2)}%`,
          right: `${navSide.toFixed(2)}%`,
          height: `${navH.toFixed(1)}px`,
          transform: `translateY(${navTranslateY.toFixed(1)}px)`,
          borderRadius: `${navBR.toFixed(1)}px`,
          background: `rgba(10,10,11,${navBgAlpha.toFixed(3)})`,
          backdropFilter: `blur(${navBlur.toFixed(1)}px)`,
          WebkitBackdropFilter: `blur(${navBlur.toFixed(1)}px)`,
          border: `1px solid rgba(255,255,255,${navBorderAlpha.toFixed(3)})`,
          overflow: "hidden",
        }}
      >
        {/* Band state — links centered */}
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            opacity: bandOpacity,
            pointerEvents: bandOpacity < 0.05 ? "none" : "auto",
          }}
        >
          {navLinks.map(({ label, href }) =>
            href.startsWith("#")
              ? <a key={href} href={href} className="px-3 py-2 text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200">{label}</a>
              : <Link key={href} href={href} className="px-3 py-2 text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200">{label}</Link>
          )}
          <span className="ml-1 flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" }}>
            <Link href="/" locale="cs" style={{ color: locale === "cs" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>CS</Link>
            <span style={{ color: "var(--color-text-ghost)" }}>/</span>
            <Link href="/" locale="en" style={{ color: locale === "en" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>EN</Link>
          </span>
        </div>

        {/* Navbar state — logo left, links right */}
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingLeft: 16, paddingRight: 16,
            opacity: navbarOpacity,
            pointerEvents: navbarOpacity < 0.05 ? "none" : "auto",
          }}
        >
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text)", whiteSpace: "nowrap" }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navLinks.map(({ label, href }) =>
              href.startsWith("#")
                ? <a key={href} href={href} className="px-3 py-2 text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200">{label}</a>
                : <Link key={href} href={href} className="px-3 py-2 text-[13px] tracking-[0.02em] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors duration-200">{label}</Link>
            )}
            <span className="ml-1 flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" }}>
              <Link href="/" locale="cs" style={{ color: locale === "cs" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>CS</Link>
              <span style={{ color: "var(--color-text-ghost)" }}>/</span>
              <Link href="/" locale="en" style={{ color: locale === "en" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>EN</Link>
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section
        id="hero"
        className="relative h-screen flex items-stretch overflow-hidden"
        aria-label={locale === "cs" ? "Úvodní sekce" : "Hero section"}
      >
        {/* Triptych */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {panelData.map((p, i) => (
            <TriptychPanel key={i} images={p.srcs} kbAnimation={p.kb} label={p.label} index={i} interval={4800 + i * 600} />
          ))}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,10,11,0.20) 0%, rgba(10,10,11,0.70) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,10,11,0.85) 0%, transparent 40%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(10,10,11,0.40) 0%, transparent 28%)" }} />

        {/* Hero content — no glass, floats directly over photos */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            opacity: heroContentOpacity,
            transform: `translateY(calc(-4vh + ${heroContentY.toFixed(1)}px))`,
            pointerEvents: ease > 0.5 ? "none" : "auto",
          }}
        >
          {/* Eyebrow */}
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            letterSpacing: "0.45em", textTransform: "uppercase",
            color: "rgba(242,240,235,0.50)", marginBottom: 22,
          }}>
            {locale === "cs" ? "Tomáš Guth Jarkovský · Praha" : "Tomáš Guth Jarkovský · Prague"}
          </div>

          {/* Wordmark */}
          <h1
            className="font-bold text-[var(--color-text)] text-center"
            style={{
              margin: 0, letterSpacing: "-0.04em", lineHeight: 0.88,
              fontSize: "clamp(80px, 10vw, 140px)",
              textShadow: "0 2px 40px rgba(0,0,0,0.4)",
            }}
          >
            {title}
          </h1>

          {/* Rule + subtitle — only when subtitle exists */}
          {subtitle && (
            <>
              <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.22)", margin: "24px 0" }} />
              <p className="text-[var(--color-text-muted)] text-center" style={{ margin: 0, fontSize: 16, letterSpacing: "0.02em" }}>
                {subtitle}
              </p>
            </>
          )}

          {/* CTAs */}
          <div
            className="flex gap-3 flex-wrap justify-center"
            style={{ marginTop: subtitle ? 28 : 20 }}
          >
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
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pointer-events-none"
          style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "rgba(242,240,235,0.35)", letterSpacing: "0.22em",
            textTransform: "uppercase", opacity: scrollHintOpacity,
          }}
        >
          <span style={{ width: 20, height: 1, background: "rgba(242,240,235,0.25)", display: "block" }} />
          <span>Scroll</span>
          <span style={{ width: 20, height: 1, background: "rgba(242,240,235,0.25)", display: "block" }} />
        </div>
      </section>

      <Grain />
    </>
  );
}
