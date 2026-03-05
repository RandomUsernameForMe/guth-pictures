"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isPortfolio = pathname.startsWith("/portfolio");

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide hover:text-gray-300 transition-colors">
          Guth Pictures
        </Link>

        <ul className="flex items-center gap-6 text-sm">
          {isPortfolio ? (
            <>
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  ← {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/#kontakt" className="text-gray-400 hover:text-white transition-colors">
                  {t("kontakt")}
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href="#o-mne" className="text-gray-400 hover:text-white transition-colors">{t("o-mne")}</a>
              </li>
              <li>
                <a href="#sluzby" className="text-gray-400 hover:text-white transition-colors">{t("sluzby")}</a>
              </li>
              <li>
                <a href="#kontakt" className="text-gray-400 hover:text-white transition-colors">{t("kontakt")}</a>
              </li>
              <li>
                <Link href="/portfolio" className="text-gray-400 hover:text-white transition-colors">
                  {t("portfolio")}
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="flex items-center gap-2 text-sm">
          <Link href={pathname} locale="cs" className="text-gray-400 hover:text-white transition-colors">
            CZ
          </Link>
          <span className="text-white/20">/</span>
          <Link href={pathname} locale="en" className="text-gray-400 hover:text-white transition-colors">
            EN
          </Link>
        </div>
      </nav>
    </header>
  );
}
