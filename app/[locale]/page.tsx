import React from "react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/modules/homepage/components/HeroSection";
import { AnimatedSection } from "@/components/AnimatedSection";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { ServiceCards, type ServiceItem } from "@/modules/homepage/components/ServiceCards";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const ogAlt = locale === "cs" ? "Guth Pictures — Fotograf Praha" : "Guth Pictures — Prague Photographer";
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { cs: "/cs", en: "/en" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
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


export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, content, images] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
    getImages().catch((): import("@/modules/admin/lib/content").SiteImages => ({ profile: "" })),
  ]);

  const normalizeSlot = (slot: unknown): string[] =>
    Array.isArray(slot) ? slot.filter((s): s is string => typeof s === "string") : [];
  const raw = images.heroTriptych as unknown;
  const heroPhotos: [string[], string[], string[]] | undefined = Array.isArray(raw) && raw.length === 3
    ? [normalizeSlot(raw[0]), normalizeSlot(raw[1]), normalizeSlot(raw[2])]
    : undefined;

  return (
    <main className="-mt-16">
      <HeroSection
        title={content.home.title}
        subtitle={content.home.subtitle}
        ctaPortfolio={t("home.ctaPortfolio")}
        ctaContact={t("home.cta")}
        locale={locale}
        photos={heroPhotos}
      />


      <AnimatedSection className="bg-[var(--color-bg)] border-y border-[var(--color-border)]">
        <section id="o-mne" className="max-w-4xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
            {/* Profilová fotka */}
            {images.profile && (
              <div className="aspect-[4/5] relative overflow-hidden">
                <Image
                  src={cloudinaryUrl(images.profile, "w_560,c_fill,g_face,q_auto,f_auto")}
                  alt={content["o-mne"].subtitle}
                  fill
                  placeholder="blur"
                  blurDataURL={blurUrl(images.profile)}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 280px"
                />
              </div>
            )}
            {/* Bio */}
            <div>
              <h2 className="text-4xl font-bold">{content["o-mne"].title}</h2>
              <p className="mt-2 text-lg text-[var(--color-text-muted)]">{content["o-mne"].subtitle}</p>
              <p className="mt-8 text-[var(--color-text-muted)] text-lg leading-relaxed">{content["o-mne"].bio}</p>
              <a
                href="#kontakt"
                className="inline-block mt-8 px-6 py-3 border border-[var(--color-border-sub)] text-sm hover:bg-[var(--color-bg-overlay)] transition-colors"
              >
                {t("o-mne.cta")} →
              </a>
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <section id="sluzby" className="max-w-4xl mx-auto px-6 py-32">
          <h2 className="text-4xl font-bold">{t("sluzby.title")}</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">{t("sluzby.subtitle")}</p>
          <ServiceCards
            selectLabel={t("sluzby.vybrat")}
            services={[
              {
                key: "portraits", number: "001", category: "portréty",
                title: content.sluzby.portraits.title,
                desc: content.sluzby.portraits.desc,
                packages: content.sluzby.portraits.packages,
                note: content.sluzby.portraits.note,
              },
              {
                key: "weddings", number: "002", category: "svatby",
                title: content.sluzby.weddings.title,
                desc: content.sluzby.weddings.desc,
                packages: content.sluzby.weddings.packages,
                note: content.sluzby.weddings.note,
              },
            ] satisfies ServiceItem[]}
          />
        </section>
      </AnimatedSection>

      <AnimatedSection className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <section id="kontakt" className="max-w-xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
          <p className="mt-2 text-[var(--color-text-muted)] mb-10">{t("kontakt.subtitle")}</p>
          <ContactForm />
        </section>
      </AnimatedSection>
    </main>
  );
}
