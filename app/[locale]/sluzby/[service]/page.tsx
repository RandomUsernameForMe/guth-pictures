import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import { siteUrl, ogImage } from "@/lib/config";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { PortraitEditorial } from "@/modules/editorial/components/PortraitEditorial";
import { PhotoGrid } from "@/modules/gallery/components/PhotoGrid";
import { ServiceLinks } from "@/modules/homepage/components/ServiceLinks";
import { isServiceSlug, servicePages, serviceSlugs } from "@/modules/homepage/lib/service-pages";

type Props = { params: Promise<{ locale: string; service: string }> };
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return serviceSlugs.map((service) => ({ service }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, service } = await params;
  if (!isServiceSlug(service)) notFound();
  const copy = servicePages[service][locale === "en" ? "en" : "cs"];
  const path = `/sluzby/${service}`;
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: { cs: `/cs${path}`, en: `/en${path}`, "x-default": `/cs${path}` },
    },
    openGraph: { title: copy.title, description: copy.description, url: `/${locale}${path}`, type: "website", images: [ogImage] },
    twitter: { card: "summary_large_image", title: copy.title, description: copy.description, images: [ogImage.url] },
  };
}

export default async function ServicePage({ params }: Props) {
  const { locale, service } = await params;
  if (!isServiceSlug(service)) notFound();
  setRequestLocale(locale);
  const cs = locale !== "en";
  const copy = servicePages[service][cs ? "cs" : "en"];
  const [content, photos, images] = await Promise.all([
    getContent(locale),
    getGalleryPhotos("portfolio").catch(() => []),
    getImages(),
  ]);
  const portraits = photos.filter((photo) => photo.category === "portréty").slice(0, 8);
  const url = `${siteUrl}/${locale}/sluzby/${service}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", "@id": `${url}#service`, name: copy.title, description: copy.description, url,
        provider: { "@id": `${siteUrl}/#business` }, areaServed: { "@type": "City", name: "Praha" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: cs ? "Domů" : "Home", item: `${siteUrl}/${locale}` },
        { "@type": "ListItem", position: 2, name: cs ? "Služby" : "Services", item: `${siteUrl}/${locale}/sluzby` },
        { "@type": "ListItem", position: 3, name: copy.title, item: url },
      ] },
    ],
  };
  if (service === "portretni-foceni") {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
        <PortraitEditorial locale={locale} copy={copy} content={content} images={images} />
      </>
    );
  }
  return (
    <main className="max-w-5xl mx-auto px-6 pt-28 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <nav aria-label={cs ? "Drobečková navigace" : "Breadcrumb"} className="text-sm text-[var(--color-text-muted)] mb-10">
        <Link href="/">{cs ? "Domů" : "Home"}</Link> / <Link href="/sluzby">{cs ? "Služby" : "Services"}</Link> / <span>{copy.title}</span>
      </nav>
      <header className="max-w-3xl">
        <p className="text-sm tracking-widest uppercase text-[var(--color-accent)] mb-4">Guth Pictures · Praha</p>
        <h1 className="text-4xl sm:text-6xl font-bold leading-tight">{copy.title}</h1>
        <p className="mt-8 text-lg leading-relaxed text-[var(--color-text-muted)]">{copy.intro}</p>
        <a href="#kontakt" className="inline-block mt-8 px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] rounded-xl">{cs ? "Domluvit focení" : "Enquire about a session"} →</a>
      </header>
      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-bold">{cs ? "Pro koho je focení" : "Who the session is for"}</h2>
        <p className="mt-5 text-[var(--color-text-muted)] leading-relaxed">{copy.audience}</p>
      </section>
      {portraits.length > 0 && (
        <section className="mt-20">
          <h2 className="text-3xl font-bold mb-6">{cs ? "Ukázky portrétní tvorby" : "Selected portrait work"}</h2>
          <PhotoGrid photos={portraits} locale={locale} />
          <Link href="/portfolio" className="inline-block mt-6 underline">{cs ? "Celé portfolio" : "Full portfolio"} →</Link>
        </section>
      )}
      <section className="mt-20">
        <h2 className="text-3xl font-bold">{cs ? "Jak focení probíhá" : "How it works"}</h2>
        <ol className="mt-8 grid sm:grid-cols-3 gap-8">
          {copy.steps.map((step, i) => <li key={step} className="border-t border-[var(--color-border)] pt-5"><span className="font-mono text-[var(--color-accent)]">0{i + 1}</span><p className="mt-4 leading-relaxed text-[var(--color-text-muted)]">{step}</p></li>)}
        </ol>
      </section>
      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-bold">{cs ? "Co připravit před focením" : "How to prepare"}</h2>
        <p className="mt-5 text-[var(--color-text-muted)] leading-relaxed">{copy.preparation}</p>
        <h2 className="mt-12 text-3xl font-bold">{cs ? "Co dostanete" : "What you receive"}</h2>
        <p className="mt-5 text-[var(--color-text-muted)] leading-relaxed">{copy.delivery}</p>
      </section>
      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-bold">{copy.pricing}</h2>
        <p className="mt-5 text-[var(--color-text-muted)] leading-relaxed">{copy.questions[2].a}</p>
      </section>
      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-bold">{cs ? "Časté otázky" : "Common questions"}</h2>
        {copy.questions.map(({ q, a }) => <div key={q} className="mt-8"><h3 className="text-xl font-semibold">{q}</h3><p className="mt-3 text-[var(--color-text-muted)] leading-relaxed">{a}</p></div>)}
        <ServiceLinks locale={locale} />
      </section>
      <section id="kontakt" className="mt-20 max-w-xl scroll-mt-24">
        <h2 className="text-3xl font-bold mb-6">{cs ? "Napište mi o svém focení" : "Tell me about your session"}</h2>
        <ContactForm />
        <Link href="/o-mne" className="inline-block mt-8 underline">{cs ? "O fotografovi" : "About the photographer"}: Tomáš Guth Jarkovský</Link>
      </section>
    </main>
  );
}
