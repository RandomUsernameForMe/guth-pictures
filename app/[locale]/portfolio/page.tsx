import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { PortfolioFilter } from "@/modules/homepage/components/PortfolioFilter";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.portfolio" });
  const ogAlt = locale === "cs" ? "Portfolio — Guth Pictures" : "Portfolio — Guth Pictures — Prague Photographer";
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/portfolio`,
      languages: { cs: "/cs/portfolio", en: "/en/portfolio", "x-default": "/cs/portfolio" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}/portfolio`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og-image.jpg"],
    },
  };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  let photos: Awaited<ReturnType<typeof getGalleryPhotos>> = [];
  let fetchError = false;
  try {
    photos = await getGalleryPhotos("portfolio");
  } catch {
    fetchError = true;
  }

  return (
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-32 pb-16">
        <h1 className="text-5xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-gray-400">{t("subtitle")}</p>
      </section>
      <section className="max-w-6xl mx-auto px-6 pb-24">
        {fetchError ? (
          <p className="text-gray-500 text-center py-24">Galerii se nepodařilo načíst. Zkuste to prosím znovu.</p>
        ) : (
          <PortfolioFilter photos={photos} locale={locale} />
        )}
      </section>
    </main>
  );
}
