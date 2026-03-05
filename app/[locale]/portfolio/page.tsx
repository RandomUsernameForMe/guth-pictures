import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { PhotoGrid } from "@/components/PhotoGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.portfolio" });
  return { title: t("title"), description: t("description"), openGraph: { title: t("title"), description: t("description") } };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, photos] = await Promise.all([
    getTranslations({ locale, namespace: "portfolio" }),
    getGalleryPhotos(),
  ]);

  return (
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-gray-400">{t("subtitle")}</p>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <PhotoGrid photos={photos} locale={locale} />
      </section>
    </main>
  );
}
