import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-white/10 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-500">
        <span>{t("copyright", { year: new Date().getFullYear() })}</span>
        <span>{t("tagline")}</span>
      </div>
    </footer>
  );
}
