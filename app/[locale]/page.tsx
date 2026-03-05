import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/ContactForm";
import { getContent } from "@/lib/content";
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
  const [t, content] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
  ]);

  return (
    <main>
      <section id="hero" className="flex flex-col items-center justify-center min-h-screen text-center px-6 py-32 sm:py-40">
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none">{content.home.title}</h1>
        <p className="mt-8 text-xl text-gray-500 max-w-xl">{content.home.subtitle}</p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/portfolio"
            className="px-8 py-4 bg-white text-black font-medium hover:bg-gray-200 transition-colors"
          >
            {t("home.cta")}
          </Link>
          <a href="#kontakt" className="px-8 py-4 border border-white hover:bg-white/5 transition-colors">
            {t("home.ctaContact")}
          </a>
        </div>
      </section>

      <section id="o-mne" className="max-w-2xl mx-auto px-6 py-32 border-t border-white/10">
        <h2 className="text-4xl font-bold">{content["o-mne"].title}</h2>
        <p className="mt-2 text-lg text-gray-500">{content["o-mne"].subtitle}</p>
        <p className="mt-12 text-gray-300 text-lg leading-relaxed">{content["o-mne"].bio}</p>
      </section>

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

      <section id="kontakt" className="max-w-xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
        <p className="mt-2 text-gray-400 mb-10">{t("kontakt.subtitle")}</p>
        <ContactForm />
      </section>
    </main>
  );
}
