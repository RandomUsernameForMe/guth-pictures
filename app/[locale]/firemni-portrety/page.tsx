import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { BusinessEditorial } from "@/modules/editorial/components/BusinessEditorial";

const PATH = "/firemni-portrety";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.firemniPortrety" });
  return { title: t("title"), description: t("description"), alternates: { canonical: `/${locale}${PATH}`, languages: { cs: `/cs${PATH}`, en: `/en${PATH}`, "x-default": `/cs${PATH}` } }, openGraph: { title: t("title"), description: t("description"), url: `/${locale}${PATH}`, locale: locale === "cs" ? "cs_CZ" : "en_US", type: "website" } };
}

export default async function FiremniPortretyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  return <BusinessEditorial locale={locale} copy={content.pages.business} business={content.sluzby.business} images={images} />;
}
