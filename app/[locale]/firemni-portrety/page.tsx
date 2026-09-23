import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Image from "next/image";
import { ContactForm } from "@/components/ContactForm";
import { AnimatedSection } from "@/components/AnimatedSection";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import { getContent } from "@/modules/admin/lib/content";
import { StickyContactCta } from "@/modules/homepage/components/StickyContactCta";
import { AT_WORK_IDS, COPY, HEADSHOT_IDS } from "@/modules/business-portraits/copy";

const PATH = "/firemni-portrety";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.firemniPortrety" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}${PATH}`,
      languages: { cs: `/cs${PATH}`, en: `/en${PATH}`, "x-default": `/cs${PATH}` },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}${PATH}`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
    },
  };
}

function Photo({ id, alt, placeholder }: { id: string; alt: string; placeholder: string }) {
  return (
    <div className="relative aspect-[4/5] border border-[var(--color-border)] overflow-hidden">
      {id ? (
        <Image src={cloudinaryUrl(id, "c_fill,g_face,w_800,h_1000,q_auto,f_auto")} alt={alt} fill sizes="(min-width: 768px) 33vw, 50vw" className="object-cover" />
      ) : (
        <div className="gp-hatch gp-hatch-accent absolute inset-0 flex items-end p-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-ghost)]">{placeholder}</span>
        </div>
      )}
    </div>
  );
}

export default async function FiremniPortretyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = COPY[locale === "en" ? "en" : "cs"];
  const { business } = (await getContent(locale)).sluzby;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <main>
      <section id="hero" className="max-w-6xl mx-auto px-6 pt-32 pb-20 grid gap-12 md:grid-cols-[1.2fr_1fr] items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-ghost)]">{copy.eyebrow}</p>
          <h1 className="mt-4 text-4xl md:text-6xl font-bold leading-tight">{copy.heroTitle}</h1>
          <p className="mt-6 text-lg text-[var(--color-text-muted)] max-w-xl">{copy.heroSubtitle}</p>
          <a
            href="#kontakt"
            className="inline-block mt-8 px-6 py-3 border border-[var(--color-border-sub)] hover:bg-[var(--color-bg-overlay)] transition-colors"
          >
            {copy.heroCta}<span aria-hidden="true"> →</span>
          </a>
        </div>
        <Photo id={HEADSHOT_IDS[0]} alt={copy.headshotsTitle} placeholder={copy.placeholder} />
      </section>

      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-3xl font-bold">{copy.useCasesTitle}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {copy.useCases.map(({ title, desc }) => (
              <div key={title} className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-3xl font-bold">{copy.headshotsTitle}</h2>
          <p className="mt-2 text-[var(--color-text-muted)] max-w-2xl">{copy.headshotsDesc}</p>
          <div className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-3">
            {HEADSHOT_IDS.slice(1).map((id, i) => (
              <Photo key={id || i} id={id} alt={copy.headshotsTitle} placeholder={copy.placeholder} />
            ))}
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="gp-hatch gp-hatch-faint border-y border-[var(--color-border-sub)]">
          <div className="max-w-6xl mx-auto px-6 py-20 grid gap-10 md:grid-cols-[1fr_2fr] items-center">
            <div>
              <h2 className="text-3xl font-bold">{copy.atWorkTitle}</h2>
              <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed">{copy.atWorkDesc}</p>
            </div>
            <div className="grid gap-4 grid-cols-3">
              {AT_WORK_IDS.map((id, i) => (
                <Photo key={id || i} id={id} alt={copy.atWorkTitle} placeholder={copy.placeholder} />
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold">{copy.stepsTitle}</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.steps.map(({ title, desc }, i) => (
              <li key={title} className="border-t border-[var(--color-border-sub)] pt-4">
                <span className="font-mono text-xs text-[var(--color-text-ghost)] tracking-widest">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{desc}</p>
              </li>
            ))}
          </ol>
        </section>
      </AnimatedSection>

      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-6 pb-20">
          <h2 className="text-3xl font-bold">{copy.pricingTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {business.packages.map((pkg, i) => (
              <div key={pkg.id ?? i} className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 flex flex-col">
                <span className="text-xs font-mono tracking-widest text-[var(--color-text-ghost)] uppercase">{pkg.name}</span>
                <span className="mt-3 text-2xl font-bold">{pkg.price}</span>
                <span className="mt-1 text-xs text-[var(--color-text-ghost)]">{pkg.duration}</span>
                <ul className="mt-4 space-y-1 flex-1">
                  {pkg.includes.filter(Boolean).map((item) => (
                    <li key={item} className="text-sm text-[var(--color-text-muted)] flex items-start gap-2">
                      <span className="text-[var(--color-text-ghost)] shrink-0">—</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={`?package=${encodeURIComponent(pkg.name)}&service=${encodeURIComponent(business.title)}#kontakt`}
                  className="self-start mt-6 px-3 py-1.5 border border-[var(--color-border-sub)] text-xs hover:bg-[var(--color-bg-overlay)] transition-colors"
                >
                  {copy.select}<span aria-hidden="true"> →</span>
                </a>
              </div>
            ))}
          </div>
          {!!business.extras?.length && (
            <div className="mt-10 max-w-2xl">
              <h3 className="font-semibold">{copy.extrasTitle}</h3>
              <dl className="mt-3 divide-y divide-[var(--color-border)]">
                {business.extras.map((x, i) => (
                  <div key={x.id ?? i} className="flex justify-between gap-4 py-2 text-sm">
                    <dt className="text-[var(--color-text-muted)]">{x.name}</dt>
                    <dd className="font-semibold shrink-0">{x.price}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {business.note && <p className="mt-6 text-xs text-[var(--color-text-ghost)]">{business.note}</p>}
        </section>
      </AnimatedSection>

      <section className="max-w-4xl mx-auto px-6 pb-16">
        {/* JSON-LD: static FAQ copy, "<" escaped so it cannot close the script tag */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
        <h2 className="text-3xl font-bold mb-8">{copy.faqTitle}</h2>
        <div className="divide-y divide-[var(--color-border)]">
          {copy.faq.map(({ q, a }) => (
            <details key={q} className="py-4 group">
              <summary className="cursor-pointer text-lg font-semibold list-none flex justify-between items-center">
                {q}
                <span aria-hidden className="ml-4 text-[var(--color-text-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-text-muted)] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="kontakt" className="max-w-xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-bold">{copy.contactTitle}</h2>
        <p className="mt-2 text-[var(--color-text-muted)] mb-10">{copy.contactSubtitle}</p>
        <ContactForm />
      </section>
      <StickyContactCta label={copy.heroCta} />
    </main>
  );
}
