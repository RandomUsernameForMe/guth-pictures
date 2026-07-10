import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Foceni101App } from "@/modules/foceni-101/components/Foceni101App";
import { siteUrl } from "@/lib/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "foceni101.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/foceni-101`,
      languages: { cs: "/cs/foceni-101", en: "/en/foceni-101", "x-default": "/cs/foceni-101" },
    },
  };
}

export default async function Foceni101Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "foceni101.meta" });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: t("title"),
    description: t("description"),
    url: `${siteUrl}/${locale}/foceni-101`,
    learningResourceType: "interactive simulation",
    educationalLevel: "beginner",
    inLanguage: locale,
    teaches: [
      "exposure", "aperture", "shutter speed", "ISO", "focal length",
      "white balance", "composition", "exposure triangle",
    ],
    isAccessibleForFree: true,
    provider: { "@type": "LocalBusiness", "@id": `${siteUrl}/#business`, name: "Guth Pictures" },
  };
  return (
    <>
      {/* JSON-LD: static const above, "<" escaped so it cannot close the script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Foceni101App />
    </>
  );
}
