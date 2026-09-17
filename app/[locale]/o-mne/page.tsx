import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { cloudinaryUrl, blurUrl, PROFILE_TRANSFORM } from "@/lib/cloudinary-utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.o-mne" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/o-mne`,
      languages: { cs: "/cs/o-mne", en: "/en/o-mne", "x-default": "/cs/o-mne" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}/o-mne`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "profile",
    },
  };
}

export default async function OMnePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, content, images] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
    getImages().catch((): import("@/modules/admin/lib/content").SiteImages => ({ profile: "" })),
  ]);

  return (
    <main>
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
          {images.profile && (
            <div className="aspect-[4/5] relative overflow-hidden">
              <Image
                src={cloudinaryUrl(images.profile, PROFILE_TRANSFORM)}
                alt={content["o-mne"].subtitle}
                fill
                placeholder="blur"
                blurDataURL={blurUrl(images.profile)}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold">{content["o-mne"].title}</h1>
            <p className="mt-2 text-lg text-[var(--color-text-muted)]">{content["o-mne"].subtitle}</p>
            <p className="mt-8 text-[var(--color-text-muted)] text-lg leading-relaxed">{content["o-mne"].bio}</p>
            <div className="mt-8 flex gap-4 flex-wrap">
              <Link
                href="/portfolio"
                className="inline-block px-6 py-3 border border-[var(--color-border-sub)] text-sm hover:bg-[var(--color-bg-overlay)] transition-colors"
              >
                {t("home.ctaPortfolio")} →
              </Link>
              <Link
                href="/sluzby"
                className="inline-block px-6 py-3 border border-[var(--color-border-sub)] text-sm hover:bg-[var(--color-bg-overlay)] transition-colors"
              >
                {t("nav.sluzby")} →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
