"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";

type Props = {
  title: string;
  subtitle: string;
  ctaPortfolio: string;
  ctaContact: string;
  photos?: [string[], string[], string[]];
  locale: string;
};

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

type PanelImage = { src: string; srcSet: string };

function TriptychPanel({
  images, interval = 5000, kbAnimation, label, index, paused,
}: {
  images: PanelImage[];
  interval?: number;
  kbAnimation: string;
  label: string;
  index: number;
  paused: boolean;
}) {
  // prev is null until the first crossfade — otherwise the initial paint would
  // eagerly load the panel's last photo underneath the first one (2x the bytes
  // for something nobody sees).
  const [[prev, cur], setPair] = useState<[number | null, number]>([null, 0]);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => setPair(([, c]) => [c, (c + 1) % images.length]), interval);
    return () => clearInterval(id);
  }, [images.length, interval]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: "var(--color-surface)", borderLeft: index > 0 ? "1px solid rgba(0,0,0,0.45)" : "none" }}
    >
      {/*
        Ken Burns + grade live on ONE promoted layer. The blend-mode tints are
        blended against the images once (cached), then the whole layer is
        transform-animated — so blends aren't recomputed against a moving
        backdrop every frame. This is what keeps the hero smooth on large
        monitors. The panel label stays OUTSIDE this layer so it doesn't scale.
      */}
      <div
        className="hero-kb absolute inset-0"
        style={{ animation: kbAnimation, animationPlayState: paused ? "paused" : "running", willChange: "transform", transform: "translateZ(0)", isolation: "isolate", contain: "paint" }}
      >
        {prev !== null && (
          <img src={images[prev]?.src} srcSet={images[prev]?.srcSet} sizes="33vw" alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" aria-hidden />
        )}
        <img key={cur} src={images[cur]?.src} srcSet={images[cur]?.srcSet} sizes="33vw" alt="" className="hero-fade absolute inset-0 w-full h-full object-cover" style={{ animation: prev === null ? "none" : "heroFadeIn 1.6s ease-out" }} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} aria-hidden />
        <FilmicTint />
        {/* Accent duotone — unifies all three panels toward the brand gold. Tune via opacities. */}
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "var(--color-accent)", mixBlendMode: "color", opacity: 0.14 }} />
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "var(--color-accent)", mixBlendMode: "soft-light", opacity: 0.24 }} />
      </div>
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

const NAV_LINK_CLASS = "px-3 py-2 text-[13px] tracking-[0.02em] text-[rgba(242,240,235,0.55)] hover:text-[var(--color-text)] transition-colors duration-200";

// rootMargin value must match the navbar height
const NAVBAR_HEIGHT = 64;

export function HeroSection({ title, subtitle, ctaPortfolio, ctaContact, photos, locale }: Props) {
  const [navbarVisible, setNavbarVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    // Sync initial state — needed when page loads with scrollY > 0 (back-navigation, scroll restoration)
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= NAVBAR_HEIGHT) {
      setNavbarVisible(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setNavbarVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${NAVBAR_HEIGHT}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const navLinks = useMemo<{ label: string; href: string }[]>(
    () => locale === "cs"
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
        ],
    [locale],
  );

  const panelData = useMemo(() => {
    const toSrcs = (ids: string[]): PanelImage[] => ids.map((id) => ({
      src: cloudinaryUrl(id, "w_800,c_fill,q_auto:good,f_auto"),
      srcSet: [400, 800, 1200]
        .map((w) => `${cloudinaryUrl(id, `w_${w},c_fill,q_auto:good,f_auto`)} ${w}w`)
        .join(", "),
    }));
    const labels = locale === "cs" ? ["Portréty", "Eventy", "Portréty"] : ["Portraits", "Events", "Portraits"];
    return [
      { srcs: toSrcs(photos?.[0] ?? []), label: labels[0], kb: "heroKb1 18s ease-in-out infinite alternate" },
      { srcs: toSrcs(photos?.[1] ?? []), label: labels[1], kb: "heroKb2 22s ease-in-out infinite alternate" },
      { srcs: toSrcs(photos?.[2] ?? []), label: labels[2], kb: "heroKb3 16s ease-in-out infinite alternate" },
    ];
  }, [photos, locale]);

  const langSwitcher = (
    <span className="ml-1 flex items-center gap-1" style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em" }}>
      <Link href={pathname} locale="cs" style={{ color: locale === "cs" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>CS</Link>
      <span style={{ color: "var(--color-text-ghost)" }}>/</span>
      <Link href={pathname} locale="en" style={{ color: locale === "en" ? "var(--color-text)" : "var(--color-text-ghost)", padding: "4px 6px" }}>EN</Link>
    </span>
  );

  return (
    <>
      <style>{`
        @keyframes heroKb1 { from { transform: scale(1.02) translate(0,0); }    to { transform: scale(1.10) translate(-1.5%,-1%); } }
        @keyframes heroKb2 { from { transform: scale(1.06) translate(0.5%,0); } to { transform: scale(1.02) translate(-0.5%,0.8%); } }
        @keyframes heroKb3 { from { transform: scale(1.04) translate(0,0); }    to { transform: scale(1.10) translate(1%,-1%); } }
        @keyframes heroFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .hero-kb, .hero-fade { animation: none !important; }
        }
      `}</style>

      {/* ── Fixed navbar — visible after hero scrolls away ──── */}
      {/*
        visibility:hidden (not just opacity:0) is intentional:
        it removes the nav from the accessibility tree and prevents
        keyboard focus when visually hidden, avoiding invisible focusable links.
      */}
      <nav
        aria-label={locale === "cs" ? "Hlavní navigace" : "Main navigation"}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          height: NAVBAR_HEIGHT,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 16,
          paddingRight: 16,
          background: "rgba(10,10,11,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          opacity: navbarVisible ? 1 : 0,
          visibility: navbarVisible ? "visible" : "hidden",
          transform: navbarVisible ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 0.3s ease, transform 0.3s ease, visibility 0.3s",
        }}
      >
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-text)", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {navLinks.map(({ label, href }) =>
            href.startsWith("#")
              ? <a key={href} href={href} className={NAV_LINK_CLASS}>{label}</a>
              : <Link key={href} href={href} className={NAV_LINK_CLASS}>{label}</Link>
          )}
          {langSwitcher}
        </div>
      </nav>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="hero"
        className="relative h-screen flex items-stretch overflow-hidden"
        aria-label={locale === "cs" ? "Úvodní sekce" : "Hero section"}
      >
        {/* Triptych */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          {panelData.map((p, i) => (
            <TriptychPanel key={i} images={p.srcs} kbAnimation={p.kb} label={p.label} index={i} interval={4800 + i * 600} paused={navbarVisible} />
          ))}
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,10,11,0.20) 0%, rgba(10,10,11,0.70) 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(10,10,11,0.85) 0%, transparent 40%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(10,10,11,0.40) 0%, transparent 28%)" }} />

        {/* Subtle perpendicular mesh in two opposite corners, fading toward center */}
        <div
          aria-hidden
          className="gp-grid absolute top-0 left-0 w-[34%] h-[44%] pointer-events-none"
          style={{
            WebkitMaskImage: "linear-gradient(135deg, rgba(0,0,0,0.85), transparent 70%)",
            maskImage: "linear-gradient(135deg, rgba(0,0,0,0.85), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="gp-grid absolute bottom-0 right-0 w-[34%] h-[44%] pointer-events-none"
          style={{
            WebkitMaskImage: "linear-gradient(315deg, rgba(0,0,0,0.85), transparent 70%)",
            maskImage: "linear-gradient(315deg, rgba(0,0,0,0.85), transparent 70%)",
          }}
        />

        {/* Hero content */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
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

          {/* Rule */}
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.22)", margin: "24px 0" }} />

          {/* Subtitle */}
          {subtitle && (
            <p className="text-[var(--color-text-muted)] text-center" style={{ margin: 0, fontSize: 16, letterSpacing: "0.02em" }}>
              {subtitle}
            </p>
          )}

          {/* CTAs + nav links — grouped so nav stays tight under buttons */}
          <div className="flex flex-col items-center gap-4" style={{ marginTop: subtitle ? 28 : 20 }}>
            <div className="flex gap-3 flex-wrap justify-center">
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

            {/* Plain nav links — no background, always tight under CTAs */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {navLinks.map(({ label, href }) =>
                href.startsWith("#")
                  ? <a key={href} href={href} className={NAV_LINK_CLASS}>{label}</a>
                  : <Link key={href} href={href} className={NAV_LINK_CLASS}>{label}</Link>
              )}
              {langSwitcher}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pointer-events-none"
          style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "rgba(242,240,235,0.35)", letterSpacing: "0.22em",
            textTransform: "uppercase",
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
