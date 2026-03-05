"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/", key: "home" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/sluzby", key: "sluzby" },
  { href: "/o-mne", key: "o-mne" },
  { href: "/kontakt", key: "kontakt" },
] as const;

export function Nav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-wide">
          Portfolio
        </Link>

        <ul className="flex items-center gap-6 text-sm">
          {links.map(({ href, key }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={key}>
                <Link
                  href={href}
                  className={isActive ? "text-white" : "text-gray-400 hover:text-white transition-colors"}
                >
                  {t(key)}
                </Link>
              </li>
            );
          })}
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
