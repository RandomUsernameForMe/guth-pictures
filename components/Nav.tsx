"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const isPortfolio = pathname.startsWith("/portfolio");
  const isBlog = pathname.startsWith("/blog");
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navBg = menuOpen
    ? "bg-black/90 backdrop-blur-sm border-white/10"
    : isHome
      ? "bg-gradient-to-b from-black/60 to-transparent border-transparent"
      : "bg-black/80 backdrop-blur-sm border-white/10";

  const desktopLinks = (isPortfolio || isBlog) ? (
    <>
      <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">← {t("home")}</Link></li>
      <li><Link href="/#kontakt" className="text-gray-400 hover:text-white transition-colors">{t("kontakt")}</Link></li>
    </>
  ) : (
    <>
      <li><a href="#o-mne" className="text-gray-400 hover:text-white transition-colors">{t("o-mne")}</a></li>
      <li><a href="#sluzby" className="text-gray-400 hover:text-white transition-colors">{t("sluzby")}</a></li>
      <li><a href="#kontakt" className="text-gray-400 hover:text-white transition-colors">{t("kontakt")}</a></li>
      <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">{t("blog")}</Link></li>
      <li><Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">{t("portfolio")}</Link></li>
    </>
  );

  const mobileLinks = (isPortfolio || isBlog) ? (
    <>
      <li><Link href="/" className="text-gray-300 hover:text-white transition-colors text-lg">← {t("home")}</Link></li>
      <li><Link href="/#kontakt" className="text-gray-300 hover:text-white transition-colors text-lg">{t("kontakt")}</Link></li>
    </>
  ) : (
    <>
      <li><a href="#o-mne" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("o-mne")}</a></li>
      <li><a href="#sluzby" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("sluzby")}</a></li>
      <li><a href="#kontakt" onClick={() => setMenuOpen(false)} className="text-gray-300 hover:text-white transition-colors text-lg">{t("kontakt")}</a></li>
      <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors text-lg">{t("blog")}</Link></li>
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
            <Link
              href={pathname}
              locale="cs"
              className={`transition-colors ${locale === "cs" ? "text-white font-medium" : "text-gray-500 hover:text-gray-300"}`}
            >
              CZ
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href={pathname}
              locale="en"
              className={`transition-colors ${locale === "en" ? "text-white font-medium" : "text-gray-500 hover:text-gray-300"}`}
            >
              EN
            </Link>
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

      {/* Mobile menu — animated */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-white/10 bg-black/95 overflow-hidden"
          >
            <ul className="flex flex-col gap-5 px-6 py-6">
              {mobileLinks}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
