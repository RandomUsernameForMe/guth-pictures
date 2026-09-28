import type { Metadata } from "next";
import { siteUrl } from "@/lib/config";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { EventsEditorial } from "@/modules/editorial/components/EventsEditorial";

const path = "/sluzby/eventy-a-svatby";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const cs = locale !== "en";
  return {
    title: cs ? "Eventy a svatby" : "Events & weddings",
    description: cs ? "Reportážní focení eventů a svateb v Praze a celé ČR." : "Documentary event and wedding photography in Prague and across the Czech Republic.",
    alternates: { canonical: `/${locale}${path}`, languages: { cs: `/cs${path}`, en: `/en${path}`, "x-default": `/cs${path}` } },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: locale === "en" ? "Events & weddings photography" : "Fotografování eventů a svateb",
    provider: { "@type": "Person", name: "Guth Pictures" },
    areaServed: "CZ",
    url: `${siteUrl}/${locale}${path}`,
  };

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }} />
    <EventsEditorial locale={locale} title={content.editorial.eventsTitle} weddings={content.sluzby.weddings} images={images} />
  </>;
}
