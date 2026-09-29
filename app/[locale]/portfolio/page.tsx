import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { PortfolioFilter } from "@/modules/homepage/components/PortfolioFilter";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.portfolio" });
  const ogAlt = locale === "cs" ? "Portfolio — Guth Pictures" : "Portfolio — Guth Pictures, Prague photographer";
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
    <EditorialSubpage active="portfolio" className="ed-secondary-portfolio">
      <section className="ed-secondary-hero">
        <p>{locale === "cs" ? "Vybraná práce" : "Selected work"}</p>
        <h1>{t("title")}</h1>
        <p>{t("subtitle")}</p>
      </section>
      <section className="ed-portfolio-content">
        {fetchError ? (
          <p role="status" className="ed-secondary-empty">
            {locale === "cs" ? "Galerii se nepodařilo načíst. Zkuste to prosím znovu." : "The gallery could not be loaded. Please try again."}
          </p>
        ) : (
          <PortfolioFilter photos={photos} locale={locale} />
        )}
      </section>
    </EditorialSubpage>
  );
}
