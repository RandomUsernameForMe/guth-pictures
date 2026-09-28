import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeEditorial } from "@/modules/editorial/components/HomeEditorial";
import { getContent, getImages } from "@/modules/admin/lib/content";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const ogAlt = locale === "cs" ? "Guth Pictures — Fotograf Praha" : "Guth Pictures — Prague Photographer";
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}`, languages: { cs: "/cs", en: "/en", "x-default": "/cs" } },
    openGraph: {
      title: t("title"), description: t("description"), url: `/${locale}`,
      locale: locale === "cs" ? "cs_CZ" : "en_US", type: "website",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description"), images: ["/og-image.jpg"] },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  return <HomeEditorial locale={locale} content={content} images={images} />;
}
