"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

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
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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

  const isActive = (href: string) =>
    (href === "/portfolio" && isPortfolio) || (href === "/blog" && isBlog);

  return (
    <>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 }}
        className="fixed top-0 inset-x-0 z-50"
      >
        <div
          className={`mx-auto transition-all duration-500 ${
            scrolled
              ? "max-w-5xl mt-3 px-4"
              : isHome
                ? "max-w-full mt-0 px-0"
                : "max-w-full mt-0 px-0"
          }`}
        >
          <div
            className={`transition-all duration-500 ${
              scrolled
                ? "rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                : isHome
                  ? "rounded-none border-b border-transparent bg-gradient-to-b from-black/70 via-black/20 to-transparent"
                  : "rounded-none border-b border-white/8 bg-black/60 backdrop-blur-md"
            }`}
          >
            <nav className="flex items-center justify-between px-6 h-16">
              {/* Logo */}
              <Link
                href="/"
                className="text-white font-semibold tracking-widest text-sm uppercase hover:text-white/70 transition-colors duration-200"
              >
                Guth Pictures
              </Link>

              {/* Desktop links */}
              <ul className="hidden md:flex items-center gap-1">
                {links.map(({ href, label, anchor }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      {anchor ? (
                        <a
                          href={href}
                          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 block ${
                            active
                              ? "text-white"
                              : "text-white/50 hover:text-white/90"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="activeDesktop"
                              className="absolute inset-0 rounded-lg bg-white/8 border border-white/12"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{label}</span>
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 block ${
                            active
                              ? "text-white"
                              : "text-white/50 hover:text-white/90"
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="activeDesktop"
                              className="absolute inset-0 rounded-lg bg-white/8 border border-white/12"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <span className="relative z-10">{label}</span>
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* Language switcher */}
                <div className="hidden md:flex items-center gap-1 text-xs font-medium tracking-wider">
                  <Link
                    href={pathname}
                    locale="cs"
                    className={`px-2 py-1 rounded transition-colors duration-200 ${
                      locale === "cs"
                        ? "text-white"
                        : "text-white/35 hover:text-white/70"
                    }`}
                  >
                    CS
                  </Link>
                  <span className="text-white/15">/</span>
                  <Link
                    href={pathname}
                    locale="en"
                    className={`px-2 py-1 rounded transition-colors duration-200 ${
                      locale === "en"
                        ? "text-white"
                        : "text-white/35 hover:text-white/70"
                    }`}
                  >
                    EN
                  </Link>
                </div>

                {/* Hamburger */}
                <button
                  className="md:hidden p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/8"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label={menuOpen ? "Zavřít menu" : "Otevřít menu"}
                  aria-expanded={menuOpen}
                  aria-controls="mobile-menu"
                >
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              key="drawer"
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-black/95 backdrop-blur-xl border-l border-white/10 md:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
                <span className="text-white font-semibold tracking-widest text-sm uppercase">
                  Guth Pictures
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/8"
                  aria-label="Zavřít menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="flex flex-col gap-1">
                  {links.map(({ href, label, anchor }, i) => {
                    const active = isActive(href);
                    return (
                      <motion.li
                        key={href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        {anchor ? (
                          <a
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className={`block px-5 py-3.5 text-base font-medium rounded-xl transition-all duration-200 ${
                              active
                                ? "text-white bg-white/8 border border-white/12"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {label}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className={`block px-5 py-3.5 text-base font-medium rounded-xl transition-all duration-200 ${
                              active
                                ? "text-white bg-white/8 border border-white/12"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {label}
                          </Link>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Language switcher */}
              <div className="px-6 py-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-sm font-medium tracking-wider">
                  <Link
                    href={pathname}
                    locale="cs"
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 text-center py-2.5 rounded-lg transition-colors duration-200 ${
                      locale === "cs"
                        ? "bg-white/10 text-white border border-white/15"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    }`}
                  >
                    Čeština
                  </Link>
                  <Link
                    href={pathname}
                    locale="en"
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 text-center py-2.5 rounded-lg transition-colors duration-200 ${
                      locale === "en"
                        ? "bg-white/10 text-white border border-white/15"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    }`}
                  >
                    English
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
