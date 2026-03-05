import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.o-mne" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}

export default function OMnePage() {
  const t = useTranslations("o-mne");

  return (
    <main className="max-w-2xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-xl text-gray-400">{t("subtitle")}</p>
      <p className="mt-8 text-gray-300 leading-relaxed">{t("bio")}</p>
      <Link
        href="/kontakt"
        className="inline-block mt-10 px-6 py-3 border border-white/30 hover:border-white transition-colors"
      >
        {t("cta")}
      </Link>
    </main>
  );
}
