import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/components/HeroSection";
import { SelectedWork } from "@/components/SelectedWork";
import { AnimatedSection } from "@/components/AnimatedSection";
import { getContent } from "@/lib/content";
import { getGalleryPhotos } from "@/lib/cloudinary";
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

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, content, photos] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
    getGalleryPhotos("portfolio").catch(() => []),
  ]);

  return (
    <main>
      <HeroSection
        title={content.home.title}
        subtitle={content.home.subtitle}
        ctaPortfolio={t("home.cta")}
        ctaContact={t("home.ctaContact")}
      />

      {photos.length > 0 && (
        <SelectedWork
          photos={photos}
          locale={locale}
          linkLabel={t("home.selectedWorkLink")}
        />
      )}

      <div className="border-t border-white/10" />
      <AnimatedSection>
        <section id="o-mne" className="max-w-4xl mx-auto px-6 py-32">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
            {/* Foto fotografa — placeholder */}
            <div className="aspect-[4/5] bg-zinc-900 flex items-center justify-center text-zinc-700 text-6xl font-light select-none">
              JG
            </div>
            {/* Bio */}
            <div>
              <h2 className="text-4xl font-bold">{content["o-mne"].title}</h2>
              <p className="mt-2 text-lg text-gray-500">{content["o-mne"].subtitle}</p>
              <p className="mt-8 text-gray-300 text-lg leading-relaxed">{content["o-mne"].bio}</p>
              <a
                href="#kontakt"
                className="inline-block mt-8 px-6 py-3 border border-white/30 text-sm hover:bg-white/5 transition-colors"
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
          <p className="mt-2 text-gray-400">{t("sluzby.subtitle")}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {services.map((key) => (
              <div key={key} className="group border border-white/20 p-8 hover:border-white/40 hover:bg-white/5 transition-all">
                <h3 className="text-lg font-semibold group-hover:text-white">{content.sluzby[key].title}</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">{content.sluzby[key].desc}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section id="kontakt" className="max-w-xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
          <p className="mt-2 text-gray-400 mb-10">{t("kontakt.subtitle")}</p>
          <ContactForm />
        </section>
      </AnimatedSection>
    </main>
  );
}
