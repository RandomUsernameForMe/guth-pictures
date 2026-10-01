import { Link } from "@/i18n/navigation";
import type { PageCopy } from "@/modules/admin/lib/page-copy";

export function ServiceLinks({ locale, pages }: { locale: string; pages: PageCopy }) {
  const language = locale === "en" ? "en" : "cs";
  return (
    <nav aria-label={language === "cs" ? "Podrobnosti focení" : "Explore photography sessions"} className="mt-8 flex flex-wrap gap-4">
      {([["portretni-foceni", pages.portrait.title], ["brandove-foceni", pages.brand.title]] as const).map(([slug, title]) => (
        <Link key={slug} href={`/sluzby/${slug}`} className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
          {title} <span aria-hidden="true">↗</span>
        </Link>
      ))}
      <Link href="/firemni-portrety" className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
        {pages.business.eyebrow} <span aria-hidden="true">↗</span>
      </Link>
      <Link href="/sluzby/eventy-a-svatby" className="border-b border-[var(--color-accent)] py-2 text-[var(--color-text)] hover:text-[var(--color-accent)]">
        {pages.events.metaTitle} <span aria-hidden="true">↗</span>
      </Link>
    </nav>
  );
}
