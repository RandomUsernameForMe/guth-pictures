"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";

type NavLink = {
  href: string;
  label: string;
  anchor?: boolean;
};

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const isPortfolio = pathname.startsWith("/portfolio");
  const isBlog = pathname.startsWith("/blog");
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBg = menuOpen
    ? "bg-black/90 backdrop-blur-sm border-white/10"
    : isHome && !scrolled
      ? "bg-gradient-to-b from-black/80 via-black/30 to-transparent border-transparent"
      : "bg-black/80 backdrop-blur-sm border-white/10";

  const subpageLinks: NavLink[] = [
    { href: "/", label: `← ${t("home")}` },
    { href: "/#kontakt", label: t("kontakt") },
  ];

  const homeLinks: NavLink[] = [
    { href: "#o-mne", label: t("o-mne"), anchor: true },
    { href: "#sluzby", label: t("sluzby"), anchor: true },
    { href: "#kontakt", label: t("kontakt"), anchor: true },
    { href: "/blog", label: t("blog") },
    { href: "/portfolio", label: t("portfolio") },
  ];

  const links = (isPortfolio || isBlog) ? subpageLinks : homeLinks;

  const linkClass = (href: string, mobile = false) => {
    const base = `transition-colors ${mobile ? "text-lg" : "text-sm"}`;
    const isActive =
      (href === "/portfolio" && isPortfolio) ||
      (href === "/blog" && isBlog);
    return `${base} ${isActive ? "text-white" : `${mobile ? "text-gray-300" : "text-gray-400"} hover:text-white`}`;
  };

  return (
    <header className={`fixed top-0 inset-x-0 z-50 border-b transition-all duration-300 ${navBg}`}>
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide hover:text-gray-300 transition-colors">
          Guth Pictures
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map(({ href, label, anchor }) => (
            <li key={href}>
              {anchor
                ? <a href={href} className={linkClass(href)}>{label}</a>
                : <Link href={href} className={linkClass(href)}>{label}</Link>
              }
            </li>
          ))}
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
            aria-controls="mobile-menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="md:hidden border-t border-white/10 bg-black/95 overflow-hidden"
          >
            <ul className="flex flex-col gap-5 px-6 py-6">
              {links.map(({ href, label, anchor }) => (
                <li key={href}>
                  {anchor
                    ? <a href={href} onClick={() => setMenuOpen(false)} className={linkClass(href, true)}>{label}</a>
                    : <Link href={href} className={linkClass(href, true)}>{label}</Link>
                  }
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
