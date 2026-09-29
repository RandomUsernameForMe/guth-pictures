"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export type ActivePage = "home" | "portrait" | "business" | "events" | "services" | "portfolio" | "about" | "blog" | "legal" | null;

type Props = {
  tone: "light" | "dark";
  active: ActivePage;
};

const hrefs = {
  home: "/",
  portrait: "/sluzby/portretni-foceni",
  business: "/firemni-portrety",
  events: "/sluzby/eventy-a-svatby",
  services: "/sluzby",
  portfolio: "/portfolio",
  about: "/o-mne",
  blog: "/blog",
  legal: "/vop",
} as const;

const secondaryPages = new Set<ActivePage>(["services", "portfolio", "about", "blog", "legal"]);

export function EditorialNav({ tone, active }: Props) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cs = locale !== "en";
  const serviceLinks = [
    { key: "portrait" as const, href: hrefs.portrait, label: cs ? "Portréty" : "Portraits" },
    { key: "business" as const, href: hrefs.business, label: "Business" },
    { key: "events" as const, href: hrefs.events, label: cs ? "Eventy a svatby" : "Events & weddings" },
  ];
  const secondaryLinks = [
    { key: "services" as const, href: hrefs.services, label: cs ? "Služby" : "Services" },
    { key: "portfolio" as const, href: hrefs.portfolio, label: "Portfolio" },
    { key: "about" as const, href: hrefs.about, label: cs ? "O mně" : "About" },
    { key: "blog" as const, href: hrefs.blog, label: "Blog" },
  ];
  const links = secondaryPages.has(active) ? secondaryLinks : serviceLinks;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  return (
    <header className={`editorial-nav editorial-nav--${tone}`}>
      <Link href="/" className="editorial-wordmark">Guth Pictures</Link>
      <nav aria-label={cs ? "Hlavní navigace" : "Main navigation"} className="editorial-nav__desktop">
        {links.map((link) => (
          <Link key={link.key} href={link.href} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>
        ))}
        <Link href="/#kontakt">{cs ? "Kontakt" : "Contact"}</Link>
      </nav>
      <div className="editorial-nav__tools">
        <Link href={active ? hrefs[active] : "/"} locale={cs ? "en" : "cs"} className="editorial-nav__locale">
          {cs ? "EN" : "CS"}
        </Link>
        <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="editorial-mobile-menu" className="editorial-nav__trigger">
          {cs ? "Menu" : "Menu"}<span aria-hidden> {open ? "×" : "☰"}</span>
        </button>
      </div>
      {open && (
        <div id="editorial-mobile-menu" className="editorial-nav__mobile">
          <nav aria-label={cs ? "Mobilní navigace" : "Mobile navigation"}>
            {links.map((link) => (
              <Link key={link.key} href={link.href} onClick={close} aria-current={active === link.key ? "page" : undefined}>{link.label}</Link>
            ))}
            <Link href="/#kontakt" onClick={close}>{cs ? "Kontakt" : "Contact"}</Link>
          </nav>
          <button type="button" onClick={close} className="editorial-nav__close">{cs ? "Zavřít" : "Close"}</button>
        </div>
      )}
    </header>
  );
}
