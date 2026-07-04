import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getContent } from "@/modules/admin/lib/content";
import { ServiceCards, type ServiceItem } from "@/modules/homepage/components/ServiceCards";

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

// FAQ answers stay consistent with VOP (storno, delivery, postprodukce) — update both together
const FAQ = {
  cs: [
    { q: "Jak probíhá objednávka focení?", a: "Objednávka probíhá elektronicky — přes kontaktní formulář, e-mailem nebo přes sociální sítě. Domluvíme si termín, rozsah a balíček; termín je závazně rezervován po uhrazení rezervačního poplatku." },
    { q: "Kde focení probíhá?", a: "V Praze a okolí — v ateliéru, v exteriéru nebo u vás. Po domluvě fotím po celé České republice." },
    { q: "Kdy a jak dostanu fotografie?", a: "Termín dodání sjednáváme individuálně podle rozsahu zakázky. Hotové fotografie předávám zabezpečeným odkazem na online galerii; odkaz platí 3 měsíce a v archivu fotky držím 6 měsíců od předání." },
    { q: "Upravujete fotografie?", a: "Ano, všechny odevzdané fotografie procházejí autorskou postprodukcí — barevné korekce, expozice, ořez. Nadstandardní retuše jsou možné po dohodě za příplatek. Neupravené RAW soubory nepředávám." },
    { q: "Co když potřebuji termín zrušit?", a: "Při zrušení méně než 14 dní před termínem propadá rezervační poplatek jako náhrada za blokaci termínu. Dřívější zrušení či přesun řešíme dohodou, u špatného počasí v exteriéru se bez sankcí domluvíme na náhradním termínu." },
    { q: "Kolik focení stojí?", a: "Ceny se odvíjejí od balíčků výše na této stránce — portrétní balíčky a svatební fotografie. Pro eventy, larpy a nestandardní zakázky připravím nabídku na míru." },
  ],
  en: [
    { q: "How do I book a shoot?", a: "Booking is electronic — via the contact form, e-mail or social media. We agree on a date, scope and package; the date is confirmed once the booking fee is paid." },
    { q: "Where do shoots take place?", a: "In and around Prague — in a studio, outdoors or at your place. Shoots across the Czech Republic are possible by arrangement." },
    { q: "When and how do I get my photos?", a: "Delivery time is agreed individually based on the scope of the job. Finished photos are delivered via a secure online gallery link valid for 3 months; I keep them archived for 6 months after delivery." },
    { q: "Do you edit the photos?", a: "Yes, all delivered photos go through my post-production — colour correction, exposure, cropping. Advanced retouching is available by agreement for an extra fee. I do not hand over unedited RAW files." },
    { q: "What if I need to cancel?", a: "Cancelling less than 14 days before the date forfeits the booking fee as compensation for blocking the slot. Earlier cancellations or reschedules are handled by agreement; bad weather for outdoor shoots means we simply pick a new date." },
    { q: "How much does a shoot cost?", a: "Prices follow the packages above — portrait packages and wedding photography. For events, larps and custom jobs I prepare a tailored quote." },
  ],
} as const;

export default async function SluzbyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, content] = await Promise.all([
    getTranslations({ locale }),
    getContent(locale),
  ]);

  const faq = FAQ[locale === "en" ? "en" : "cs"];
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
    <main>
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <h1 className="text-5xl font-bold">{t("sluzby.title")}</h1>
        <p className="mt-4 text-lg text-[var(--color-text-muted)]">{t("sluzby.subtitle")}</p>
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
      <section className="max-w-4xl mx-auto px-6 pb-16">
        {/* JSON-LD: static FAQ const above, "<" escaped so it cannot close the script tag */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
        <h2 className="text-4xl font-bold mb-8">{locale === "cs" ? "Časté dotazy" : "FAQ"}</h2>
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
      <section id="kontakt" className="max-w-xl mx-auto px-6 pb-24">
        <h2 className="text-4xl font-bold">{t("kontakt.title")}</h2>
        <p className="mt-2 text-[var(--color-text-muted)] mb-10">{t("kontakt.subtitle")}</p>
        <ContactForm />
      </section>
    </main>
  );
}
