import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getContent } from "@/modules/admin/lib/content";
import { ServiceCards, type ServiceItem } from "@/modules/homepage/components/ServiceCards";
import { ServiceLinks } from "@/modules/homepage/components/ServiceLinks";
import { EditorialSubpage } from "@/modules/editorial/components/EditorialSubpage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.sluzby" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/sluzby`,
      languages: { cs: "/cs/sluzby", en: "/en/sluzby", "x-default": "/cs/sluzby" },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}/sluzby`,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      type: "website",
    },
  };
}

export default async function SluzbyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const content = await getContent(locale);
  const copy = content.pages.services;
  const faq = copy.faq;
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <EditorialSubpage active="services" className="ed-secondary-services">
      <section className="ed-secondary-hero">
        <p>{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </section>
      <section className="ed-secondary-services__list" aria-label={locale === "cs" ? "Nabídka focení" : "Photography offer"}>
        <ServiceCards
          selectLabel={copy.select}
          services={[
            {
              key: "portraits", category: "portréty",
              title: content.sluzby.portraits.title,
              desc: content.sluzby.portraits.desc,
              packages: content.sluzby.portraits.packages,
              note: content.sluzby.portraits.note,
            },
            {
              key: "weddings", category: "svatby",
              title: content.sluzby.weddings.title,
              desc: content.sluzby.weddings.desc,
              packages: content.sluzby.weddings.packages,
              note: content.sluzby.weddings.note,
              href: `/${locale}/sluzby/eventy-a-svatby`,
              hrefLabel: locale === "cs" ? "Vše o eventech a svatbách" : "All about events and weddings",
            },
            {
              key: "business", category: "firemní",
              title: content.sluzby.business.title,
              desc: content.sluzby.business.desc,
              packages: content.sluzby.business.packages,
              note: content.sluzby.business.note,
              href: `/${locale}/firemni-portrety`,
              hrefLabel: locale === "cs" ? "Vše o firemních portrétech" : "All about business portraits",
            },
          ] satisfies ServiceItem[]}
        />
        <ServiceLinks locale={locale} pages={content.pages} />
      </section>
      <section className="ed-secondary-faq">
        {/* JSON-LD: admin-edited FAQ, "<" escaped so it cannot close the script tag */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
        <h2>{copy.faqTitle}</h2>
        <div className="divide-y divide-[var(--color-border)]">
          {faq.map(({ q, a }) => (
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
      <section id="kontakt" className="ed-secondary-contact">
        <h2>{copy.contactTitle}</h2>
        <p className="mt-2 text-[var(--color-text-muted)] mb-10">{copy.contactSubtitle}</p>
        <ContactForm />
      </section>
    </EditorialSubpage>
  );
}
