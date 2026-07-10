import type { Metadata } from "next";
import { Foceni101App } from "@/modules/foceni-101/components/Foceni101App";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "cs" ? "Focení 101 — co dělá fotku" : "Photography 101 — what makes a photo",
    description: locale === "cs"
      ? "Interaktivní průvodce pro nefotografy. Posuň posuvník a uvidíš, co clona, čas závěrky, ISO a ohnisko udělají s fotkou. Žádný žargon."
      : "Interactive guide for non-photographers. Drag a slider and see what aperture, shutter speed, ISO and focal length do to a photo. No jargon. (Czech only)",
    alternates: {
      canonical: `/${locale}/foceni-101`,
      languages: { cs: "/cs/foceni-101", en: "/en/foceni-101", "x-default": "/cs/foceni-101" },
    },
  };
}

export default async function Foceni101Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <Foceni101App locale={locale} />;
}
