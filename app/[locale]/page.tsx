import React from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/components/HeroSection";
import { SelectedWork } from "@/components/SelectedWork";
import { AnimatedSection } from "@/components/AnimatedSection";
import { WordReveal } from "@/components/WordReveal";
import { getContent, getImages } from "@/lib/content";
import { getGalleryPhotos } from "@/lib/cloudinary";
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

const services = ["portraits", "weddings", "larp"] as const;
const serviceCategory: Record<typeof services[number], string> = {
  portraits: "portréty",
  weddings: "svatby",
  larp: "larpy",
};
const serviceNumber: Record<typeof services[number], string> = {
  portraits: "001",
  weddings: "002",
  larp: "003",
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, content, photos, images] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
    getGalleryPhotos("portfolio").catch(() => []),
    getImages().catch(() => ({ hero: "", profile: "" })),
  ]);

  return (
    <main>
      <HeroSection
        title={content.home.title}
        subtitle={content.home.subtitle}
        ctaPortfolio={t("home.cta")}
        ctaContact={t("home.ctaContact")}
        heroPublicId={images.hero || undefined}
      />

      {photos.length > 0 && (
        <SelectedWork
          photos={photos}
          locale={locale}
          title={t("home.selectedWorkTitle")}
          linkLabel={t("home.selectedWorkLink")}
        />
      )}

      <div className="border-t border-[var(--color-border)]" />
      <AnimatedSection>
        <section id="o-mne" className="max-w-4xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
            {/* Profilová fotka */}
            {images.profile ? (
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
            ) : (
              <div className="aspect-[4/5] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-ghost)] text-6xl font-light select-none">
                JG
              </div>
            )}
            {/* Bio */}
            <div>
              <h2 className="text-4xl font-bold">{content["o-mne"].title}</h2>
              <p className="mt-2 text-lg text-[var(--color-text-muted)]">{content["o-mne"].subtitle}</p>
              <WordReveal text={content["o-mne"].bio} className="mt-8 text-[var(--color-text-muted)] text-lg leading-relaxed" />
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

      <AnimatedSection>
        <section id="sluzby" className="max-w-4xl mx-auto px-6 py-32">
          <h2 className="text-4xl font-bold">{t("sluzby.title")}</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">{t("sluzby.subtitle")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {services.map((key) => {
              return (
                <Link
                  key={key}
                  href={`/portfolio?category=${serviceCategory[key]}`}
                  className="group relative border border-[var(--color-border)] p-8 flex flex-col hover:border-[var(--color-border-sub)] hover:bg-[var(--color-bg-overlay)] transition-all duration-300 block overflow-hidden"
                >
                  {/* number */}
                  <span className="font-mono text-xs text-[var(--color-text-ghost)] tracking-widest mb-6">
                    {serviceNumber[key]}
                  </span>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">{content.sluzby[key].title}</h3>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)] leading-relaxed flex-1">{content.sluzby[key].desc}</p>
                  <span className="inline-flex items-center gap-1 mt-6 text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-text)] transition-colors duration-300">
                    {t("home.cta")} →
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section id="kontakt" className="max-w-xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
          <p className="mt-2 text-[var(--color-text-muted)] mb-10">{t("kontakt.subtitle")}</p>
          <ContactForm />
        </section>
      </AnimatedSection>
    </main>
  );
}
