import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.sluzby" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}

const services = ["portraits", "weddings", "larp"] as const;

export default function SluzbyPage() {
  const t = useTranslations("sluzby");

  return (
    <main className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-gray-400">{t("subtitle")}</p>

      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {services.map((key) => (
          <div key={key} className="border border-white/10 p-6">
            <h2 className="text-lg font-semibold">{t(`${key}.title`)}</h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">{t(`${key}.desc`)}</p>
          </div>
        ))}
      </div>

      <Link
        href="/kontakt"
        className="inline-block mt-12 px-6 py-3 border border-white/30 hover:border-white transition-colors"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
