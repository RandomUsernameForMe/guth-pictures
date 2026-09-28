import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedSiteImages, ServiceContent } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";

type Props = { locale: string; title: string; weddings: ServiceContent; images: NormalizedSiteImages };
export function EventsEditorial({ locale, title, weddings, images }: Props) {
  const cs = locale !== "en"; const slots = images.editorial.events;
  return <main className="editorial-events"><EditorialNav tone="light" active="events" />
    <header className="ed-events-hero"><div><h1>{title}</h1><p>{cs ? "Eventy a svatby" : "Events & weddings"}</p><a href="#kontakt">{cs ? "Poptat termín" : "Ask about a date"}</a></div><figure><EditorialImageView image={slots.hero} locale={locale} priority sizes="100vw" placeholderLabel={cs ? "Reportážní fotografie bude doplněna" : "Reportage photo coming soon"} /></figure></header>
    <section className="ed-events-strip">{slots.reportage.slice(0,3).map((image,i)=><figure key={i}><EditorialImageView image={image} locale={locale} sizes="33vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure>)}</section>
    <section className="ed-events-wide"><figure><EditorialImageView image={slots.reportage[3]} locale={locale} sizes="100vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} /></figure></section>
    <section className="ed-events-info"><h2>{cs ? "Lidé. Dění. Atmosféra." : "People. Action. Atmosphere."}</h2><p>{cs ? "Skutečné momenty tak, jak se dějí. Bez aranžmá a bez přetvářky." : "Real moments as they happen. Unstaged and honest."}</p><Link href="/portfolio">{cs ? "Larpové projekty v portfoliu" : "Larp projects in the portfolio"}</Link></section>
    <section className="ed-events-pricing"><h2>{cs ? "Svatby a oslavy" : "Weddings and celebrations"}</h2>{weddings.packages.map(pkg=><article key={pkg.id ?? pkg.name}><h3>{pkg.name}</h3><strong>{pkg.price}</strong><p>{pkg.duration}</p></article>)}{weddings.note&&<p>{weddings.note}</p>}</section>
    <section id="kontakt" className="ed-events-contact"><h2>{cs ? "Poptat termín" : "Ask about a date"}</h2><ContactForm /></section>
  </main>;
}
