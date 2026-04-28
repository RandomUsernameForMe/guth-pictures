import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Props = {
  title: string;
  subtitle: string;
  email: string;
};

export function Footer({ title, subtitle, email }: Props) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-[var(--color-bg)] border-t border-[var(--color-border)] py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand + tagline */}
          <div>
            <Link href="/" className="text-lg font-semibold tracking-widest uppercase text-[var(--color-text)] hover:text-[var(--color-text-muted)] transition-colors">
              {title}
            </Link>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{subtitle}</p>
          </div>

          {/* Quick nav */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-text-muted)]">
            <Link href="/portfolio" className="hover:text-[var(--color-text)] transition-colors">{tNav("portfolio")}</Link>
            <Link href="/blog" className="hover:text-[var(--color-text)] transition-colors">{tNav("blog")}</Link>
            <a href="/#kontakt" className="hover:text-[var(--color-text)] transition-colors">{tNav("kontakt")}</a>
            <Link href="/vop" className="hover:text-[var(--color-text)] transition-colors">{tNav("vop")}</Link>
            <a href={`mailto:${email}`} className="hover:text-[var(--color-text)] transition-colors">{email}</a>
          </nav>
        </div>

        <p className="mt-8 text-xs text-[var(--color-text-ghost)]">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
