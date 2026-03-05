import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="flex flex-col items-center justify-center flex-1 text-center px-6 py-24">
      <h1 className="text-5xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-4 text-xl text-gray-400">{t("subtitle")}</p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/portfolio"
          className="px-6 py-3 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
        >
          {t("cta")}
        </Link>
        <Link
          href="/kontakt"
          className="px-6 py-3 border border-white/30 hover:border-white transition-colors"
        >
          {t("ctaContact")}
        </Link>
      </div>
    </main>
  );
}
