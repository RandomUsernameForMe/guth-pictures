import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

export function PortraitEditorial({ locale, content, images }: Props) {
  const cs = locale !== "en";
  const copy = content.pages.portrait;
  const gallery = images.editorial.portrait.gallery;
  return (
    <main className="editorial-portrait">
      <EditorialNav tone="dark" active="portrait" />
      <header className="ed-portrait-hero">
        <div className="ed-portrait-hero__image"><EditorialImageView image={images.editorial.portrait.hero} locale={locale} priority sizes="100vw" placeholderLabel={cs ? "Portrétní fotografie bude doplněna" : "Portrait coming soon"} /></div>
        <div className="ed-portrait-hero__copy"><p>{copy.kicker}</p><h1>{copy.heroTitle}</h1><a href="#kontakt">{copy.cta}</a></div>
      </header>
      <section className="ed-portrait-gallery" aria-label={cs ? "Ukázky tvorby" : "Selected work"}>
        {gallery.map((image, i) => <figure key={`${image.publicId}-${i}`}><EditorialImageView image={image} locale={locale} sizes="(max-width: 760px) 100vw, 45vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure>)}
      </section>
      <section className="ed-portrait-process"><h2>{copy.processTitle}</h2><p>{copy.intro}</p><ol>{copy.steps.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><p>{copy.lightQuestion} <Link href="/foceni-101">Focení 101</Link></p></section>
      <section className="ed-portrait-pricing"><h2>{copy.pricing}</h2><div>{content.sluzby.portraits.packages.map((pkg) => <article key={pkg.id ?? pkg.name}><h3>{pkg.name}</h3><strong>{pkg.price}</strong><p>{pkg.duration}</p><ul>{pkg.includes.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
      <section id="kontakt" className="ed-portrait-contact"><h2>{copy.cta}</h2><ContactForm /></section>
    </main>
  );
}
