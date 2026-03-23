import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { contactEmail } from "@/lib/config";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-black border-t border-white/10 py-12 mt-auto">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand + tagline */}
          <div>
            <Link href="/" className="text-lg font-semibold tracking-widest uppercase text-sm hover:text-white/70 transition-colors duration-200">
              Guth Pictures
            </Link>
            <p className="mt-1 text-sm text-white/40">{t("tagline")}</p>
          </div>

          {/* Quick nav */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/40">
            <Link href="/portfolio" className="hover:text-white/80 transition-colors duration-200">{tNav("portfolio")}</Link>
            <Link href="/blog" className="hover:text-white/80 transition-colors duration-200">{tNav("blog")}</Link>
            <a href="/#kontakt" className="hover:text-white/80 transition-colors duration-200">{tNav("kontakt")}</a>
            <a href={`mailto:${contactEmail}`} className="hover:text-white/80 transition-colors duration-200">{contactEmail}</a>
          </nav>
        </div>

        <p className="mt-8 text-xs text-white/25">{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
