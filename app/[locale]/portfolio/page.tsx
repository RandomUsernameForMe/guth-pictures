import { useTranslations } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.portfolio" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}
import { getGalleryPhotos } from "@/lib/cloudinary";
import { PhotoGrid } from "@/components/PhotoGrid";

export default async function PortfolioPage() {
  const t = useTranslations("portfolio");
  const locale = await getLocale();
  const photos = await getGalleryPhotos();

  return (
    <main className="max-w-6xl mx-auto px-6 py-24">
      <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
      <p className="text-gray-400 mb-12">{t("subtitle")}</p>
      <PhotoGrid photos={photos} locale={locale} />
    </main>
  );
}
