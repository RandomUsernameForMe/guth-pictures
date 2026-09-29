import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { cloudinaryUrl, blurUrl, PROFILE_TRANSFORM } from "@/lib/cloudinary-utils";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

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
    <EditorialSubpage active="about" className="ed-secondary-about">
      <section className={`ed-about-layout ${images.profile ? "" : "ed-about-layout--text"}`.trim()}>
        <div className="ed-about-layout__inner">
          {images.profile && (
            <figure className="ed-about-layout__portrait">
              <Image
                src={cloudinaryUrl(images.profile, PROFILE_TRANSFORM)}
                alt={content["o-mne"].subtitle}
                fill
                placeholder="blur"
                blurDataURL={blurUrl(images.profile)}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 280px"
              />
            </figure>
          )}
          <div className="ed-about-layout__copy">
            <p className="ed-about-layout__eyebrow">{locale === "cs" ? "Fotograf" : "Photographer"}</p>
            <h1>{content["o-mne"].title}</h1>
            <p className="ed-about-layout__subtitle">{content["o-mne"].subtitle}</p>
            <p className="ed-about-layout__bio">{content["o-mne"].bio}</p>
            <div className="ed-about-layout__links">
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
    </EditorialSubpage>
  );
}
