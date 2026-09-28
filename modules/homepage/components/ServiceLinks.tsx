import { Link } from "@/i18n/navigation";
import { servicePages, serviceSlugs } from "../lib/service-pages";

export function ServiceLinks({ locale }: { locale: string }) {
  const language = locale === "en" ? "en" : "cs";
  return (
    <nav aria-label={language === "cs" ? "Podrobnosti focení" : "Explore photography sessions"} className="mt-8 flex flex-wrap gap-4">
      {serviceSlugs.map((slug) => (
        <Link key={slug} href={`/sluzby/${slug}`} className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
          {servicePages[slug][language].title} <span aria-hidden="true">↗</span>
        </Link>
      ))}
      <Link href="/firemni-portrety" className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
        {language === "cs" ? "Firemní portréty" : "Business portraits"} <span aria-hidden="true">↗</span>
      </Link>
      <Link href="/sluzby/eventy-a-svatby" className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
        {language === "cs" ? "Eventy a svatby" : "Events & weddings"} <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
