import { ContactForm } from "@/components/ContactForm";
import { Link } from "@/i18n/navigation";
import type { NormalizedContentData, NormalizedSiteImages } from "@/modules/admin/lib/content";
import { EditorialImageView } from "./EditorialImage";
import { EditorialNav } from "./EditorialNav";
import { ToolPreview } from "./ToolPreview";

type Props = { locale: string; content: NormalizedContentData; images: NormalizedSiteImages };

export function HomeEditorial({ locale, content, images }: Props) {
  const cs = locale !== "en";
  const copy = cs ? {
    title: "Jiný pohled.", intro: "Portréty s charakterem. Příběhy v obrazech.", work: "Vybrané příběhy",
    about: "Zajímá mě člověk. Ne dokonalá póza.", tools: "Dva nástroje pro tvůj lepší pohled.",
    contact: "Co spolu vytvoříme?", creative: "Kreativní portrét", business: "Business portrét", events: "Eventy a svatby",
  } : {
    title: "A different view.", intro: "Portraits with character. Stories in images.", work: "Selected stories",
    about: "I care about the person. Not a perfect pose.", tools: "Two tools for a better view.",
    contact: "What will we create?", creative: "Creative portrait", business: "Business portrait", events: "Events & weddings",
  };
  const stories = images.editorial.home.stories;

  return (
    <main className="editorial-home">
      <EditorialNav tone="light" active="home" />
      <section className="ed-home-hero">
        <div className="ed-home-hero__copy">
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
          <nav aria-label={cs ? "Fotografické služby" : "Photography services"} className="ed-service-index">
            <Link href="/sluzby/portretni-foceni"><span>01</span>{copy.creative}</Link>
            <Link href="/firemni-portrety"><span>02</span>{copy.business}</Link>
            <Link href="/sluzby/eventy-a-svatby"><span>03</span>{copy.events}</Link>
          </nav>
        </div>
        <div className="ed-home-hero__image">
          <EditorialImageView image={images.editorial.home.hero} locale={locale} priority sizes="(max-width: 760px) 100vw, 62vw" placeholderLabel={cs ? "Úvodní fotografie bude doplněna" : "Hero photograph coming soon"} />
        </div>
      </section>

      <section id="tvorba" className="ed-home-work">
        <h2>{copy.work}</h2>
        <div className="ed-home-work__grid">
          {stories.map((image, index) => (
            <figure key={`${image.publicId}-${index}`} className={`ed-home-story ed-home-story--${index + 1}`}>
              <EditorialImageView image={image} locale={locale} sizes="(max-width: 760px) 100vw, 45vw" placeholderLabel={cs ? "Fotografie bude doplněna" : "Photo coming soon"} />
            </figure>
          ))}
        </div>
      </section>

      <section id="o-mne" className="ed-home-about">
        <div className="ed-home-about__image">
          <EditorialImageView image={images.editorial.home.photographer} locale={locale} sizes="(max-width: 760px) 100vw, 38vw" placeholderLabel={cs ? "Portrét fotografa" : "Photographer portrait"} />
        </div>
        <div>
          <p className="ed-kicker">{cs ? "Za fotoaparátem" : "Behind the camera"}</p>
          <h2>{copy.about}</h2>
          <p>{content["o-mne"].bio}</p>
          <Link href="/o-mne">{cs ? "Více o mně" : "More about me"}</Link>
        </div>
      </section>

      <section id="foto-nastroje" className="ed-home-tools">
        <h2>{copy.tools}</h2>
        <div className="ed-home-tools__grid">
          <ToolPreview locale={locale} image={images.editorial.home.tools.foceni101} fallback="/editorial/foceni-101-preview.webp" title="Focení 101" description={cs ? "Prozkoumej, co ve fotografii dělá světlo, expozice a kompozice." : "Explore how light, exposure and composition shape a photograph."} href="/foceni-101" cta={cs ? "Vyzkoušet" : "Try it"} />
          <ToolPreview locale={locale} image={images.editorial.home.tools.lightPlanner} fallback="/editorial/light-planner-preview.webp" title="Light planner" description={content.lightTesterPromo.desc} href="/light-tester" cta={cs ? "Otevřít plánovač" : "Open planner"} notice={cs ? "Plánovač funguje na větší obrazovce." : "The planner requires a larger screen."} />
        </div>
      </section>

      <section id="kontakt" className="ed-home-contact">
        <h2>{copy.contact}</h2>
        <ContactForm />
      </section>
    </main>
  );
}
