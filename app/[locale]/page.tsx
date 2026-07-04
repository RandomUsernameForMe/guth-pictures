import React from "react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/modules/homepage/components/HeroSection";
import { AnimatedSection } from "@/components/AnimatedSection";
import { HomeAurora } from "@/components/HomeAurora";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { ServiceCards, type ServiceItem } from "@/modules/homepage/components/ServiceCards";
import { LightTesterPromo } from "@/modules/homepage/components/LightTesterPromo";
import { cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";
import Image from "next/image";
import type { Metadata } from "next";
import { Testimonials } from "@/modules/homepage/components/Testimonials";
import { StickyContactCta } from "@/modules/homepage/components/StickyContactCta";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  const ogAlt = locale === "cs" ? "Guth Pictures — Fotograf Praha" : "Guth Pictures — Prague Photographer";
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { cs: "/cs", en: "/en", "x-default": "/cs" },
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

  return (
    <main className="-mt-16">
      <HomeAurora />
      <HeroSection
        title={content.home.title}
        subtitle={content.home.subtitle}
        ctaPortfolio={t("home.ctaPortfolio")}
        ctaContact={t("home.cta")}
        locale={locale}
        photos={images.heroTriptych}
      />


      <div className="relative gp-hatch gp-hatch-faint">
      <AnimatedSection>
        <section id="o-mne" className="max-w-4xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
            {/* Profilová fotka + šrafovaný rámeček za ní */}
            {images.profile && (
              <div className="relative isolate">
                <div
                  aria-hidden
                  className="gp-hatch gp-hatch-accent absolute -bottom-5 -right-5 -z-10 w-28 h-40 border border-[var(--color-border-sub)]"
                />
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
                  {/* Accent duotone — matches hero triptych panels */}
                  <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "var(--color-accent)", mixBlendMode: "color", opacity: 0.14 }} />
                  <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "var(--color-accent)", mixBlendMode: "soft-light", opacity: 0.24 }} />
                </div>
              </div>
            )}
            {/* Bio */}
            <div>
              <div className="hp-eyebrow">01</div>
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

      <AnimatedSection>
        <section id="sluzby" className="max-w-4xl mx-auto px-6 py-32">
          <div className="hp-eyebrow">02</div>
          <h2 className="text-4xl font-bold">{t("sluzby.title")}</h2>
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

      <AnimatedSection>
        <section className="gp-hatch gp-hatch-accent border-y border-[var(--color-border-sub)]">
          <div className="max-w-4xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text)]">{t("midCta.title")}</h2>
            <a
              href="#kontakt"
              className="px-7 py-3.5 bg-[var(--color-text)] text-[var(--color-bg)] font-medium text-sm rounded-xl hover:opacity-90 transition-opacity duration-200 inline-flex items-center gap-2"
            >
              {t("midCta.cta")} <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <Testimonials
          testimonials={content.testimonials}
          locale={locale}
          eyebrow="03"
          title={t("testimonials.title")}
        />
      </AnimatedSection>

      <AnimatedSection>
        <LightTesterPromo
          label={t("light-tester-promo.label")}
          title={content.lightTesterPromo.title}
          desc={content.lightTesterPromo.desc}
          cta={t("light-tester-promo.cta")}
          locale={locale}
        />
      </AnimatedSection>

      <AnimatedSection>
        <section id="kontakt" className="max-w-xl mx-auto px-6 py-24">
          <div className="hp-eyebrow">04</div>
          <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
          <p className="mt-2 text-[var(--color-text-muted)] mb-10">{t("kontakt.subtitle")}</p>
          <ContactForm />
        </section>
      </AnimatedSection>
      </div>
      <StickyContactCta label={t("home.cta")} />
    </main>
  );
}
