"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isPortfolio = pathname.startsWith("/portfolio");
  const [scrolled, setScrolled] = useState(isPortfolio);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isPortfolio) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPortfolio]);

  // Zavřít menu při změně route
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navBg = scrolled || menuOpen
    ? "bg-black/80 backdrop-blur-sm border-white/10"
    : "bg-transparent border-transparent";

  const desktopLinks = isPortfolio ? (
    <>
      <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">← {t("home")}</Link></li>
      <li><Link href="/#kontakt" className="text-gray-400 hover:text-white transition-colors">{t("kontakt")}</Link></li>
    </>
  ) : (
    <>
      <li><a href="#o-mne" className="text-gray-400 hover:text-white transition-colors">{t("o-mne")}</a></li>
      <li><a href="#sluzby" className="text-gray-400 hover:text-white transition-colors">{t("sluzby")}</a></li>
      <li><a href="#kontakt" className="text-gray-400 hover:text-white transition-colors">{t("kontakt")}</a></li>
      <li><Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">{t("portfolio")}</Link></li>
    </>
  );

  const mobileLinks = isPortfolio ? (
    <>
      <li><Link href="/" className="text-gray-300 hover:text-white transition-colors text-lg">← {t("home")}</Link></li>
      <li><Link href="/#kontakt" className="text-gray-300 hover:text-white transition-colors text-lg">{t("kontakt")}</Link></li>
    </>
  ) : (
    <>
      <li><a href="#o-mne" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("o-mne")}</a></li>
      <li><a href="#sluzby" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("sluzby")}</a></li>
      <li><a href="#kontakt" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("kontakt")}</a></li>
      <li><Link href="/portfolio" className="text-gray-300 hover:text-white transition-colors text-lg">{t("portfolio")}</Link></li>
    </>
  );

  return (
    <header className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${navBg}`}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide hover:text-gray-300 transition-colors">
          Guth Pictures
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {desktopLinks}
        </ul>

        <div className="flex items-center gap-4">
          {/* Language switcher */}
          <div className="flex items-center gap-2 text-sm">
            <Link href={pathname} locale="cs" className="text-gray-400 hover:text-white transition-colors">CZ</Link>
            <span className="text-white/20">/</span>
            <Link href={pathname} locale="en" className="text-gray-400 hover:text-white transition-colors">EN</Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/95 px-6 py-6">
          <ul className="flex flex-col gap-5">
            {mobileLinks}
          </ul>
        </div>
      )}
    </header>
  );
}
