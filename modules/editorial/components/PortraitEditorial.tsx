import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import type { ServiceCopy } from "@/modules/homepage/lib/service-pages";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";

type Props = { locale: string; copy: ServiceCopy; content: NormalizedContentData; images: NormalizedSiteImages };

export function PortraitEditorial({ locale, copy, content, images }: Props) {
  const cs = locale !== "en";
  const gallery = images.editorial.portrait.gallery;
  return (
    <main className="editorial-portrait">
      <EditorialNav tone="dark" active="portrait" />
      <header className="ed-portrait-hero">
        <div className="ed-portrait-hero__image"><EditorialImageView image={images.editorial.portrait.hero} locale={locale} priority sizes="100vw" placeholderLabel={cs ? "Portrétní fotografie bude doplněna" : "Portrait coming soon"} /></div>
        <div className="ed-portrait-hero__copy"><p>{cs ? "Kreativní portrét" : "Creative portrait"}</p><h1>{cs ? "Tvoje tvář. Jinak." : "Your face. Seen differently."}</h1><a href="#kontakt">{cs ? "Domluvit portrét" : "Book a portrait"}</a></div>
      </header>
      <section className="ed-portrait-gallery" aria-label={cs ? "Ukázky tvorby" : "Selected work"}>
        {gallery.map((image, i) => <figure key={`${image.publicId}-${i}`}><EditorialImageView image={image} locale={locale} sizes="(max-width: 760px) 100vw, 45vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure>)}
      </section>
      <section className="ed-portrait-process"><h2>{cs ? "Prostor pro tvůj výraz." : "Room for your expression."}</h2><p>{copy.intro}</p><ol>{copy.steps.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><p>{cs ? "Chceš před focením pochopit, jak pracuji se světlem?" : "Want to understand how I work with light before the shoot?"} <Link href="/foceni-101">Focení 101</Link></p></section>
      <section className="ed-portrait-pricing"><h2>{copy.pricing}</h2><div>{content.sluzby.portraits.packages.map((pkg) => <article key={pkg.id ?? pkg.name}><h3>{pkg.name}</h3><strong>{pkg.price}</strong><p>{pkg.duration}</p><ul>{pkg.includes.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div></section>
      <section id="kontakt" className="ed-portrait-contact"><h2>{cs ? "Domluvit portrét" : "Book a portrait"}</h2><ContactForm /></section>
    </main>
  );
}
