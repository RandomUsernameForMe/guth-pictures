import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };
export function EventsEditorial({ locale, content, images }: Props) {
  const title = content.editorial.eventsTitle; const weddings = content.sluzby.weddings;
  const cs = locale !== "en"; const slots = images.editorial.events; const copy = content.pages.events;
  return <main className="editorial-events"><EditorialNav tone="light" active="events" />
    <header className="ed-events-hero"><div><span className="ed-events-soon">{cs ? "Připravujeme" : "Coming soon"}</span><h1>{title}</h1><p>{copy.kicker}</p><a href="#kontakt">{copy.cta}</a></div><figure><EditorialImageView image={slots.hero} locale={locale} priority sizes="100vw" placeholderLabel={cs ? "Reportážní fotografie bude doplněna" : "Reportage photo coming soon"} /></figure></header>
    <section className="ed-events-strip">{slots.reportage.slice(0,3).map((image,i)=><figure key={i}><EditorialImageView image={image} locale={locale} sizes="33vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure>)}</section>
    <section className="ed-events-wide"><figure><EditorialImageView image={slots.reportage[3]} locale={locale} sizes="100vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure></section>
    <section className="ed-events-info"><h2>{copy.infoTitle}</h2><p>{copy.infoText}</p><Link href="/portfolio">{copy.larpLink}</Link></section>
    <section className="ed-events-pricing"><h2>{copy.pricingTitle}</h2>{weddings.packages.map(pkg=><article key={pkg.id ?? pkg.name}><h3>{pkg.name}</h3><strong>{pkg.price}</strong><p>{pkg.duration}</p></article>)}{weddings.note&&<p>{weddings.note}</p>}</section>
    <section id="kontakt" className="ed-events-contact"><h2>{copy.cta}</h2><ContactForm /></section>
  </main>;
}
