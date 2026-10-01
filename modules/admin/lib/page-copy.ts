// Editable page copy (admin → Obsah). Defaults are the texts that used to be hardcoded;
// stored KV copy is merged over them, so new fields appear without migrating KV data.
import { COPY as BUSINESS_COPY, type Copy as BusinessCopy } from "@/modules/business-portraits/copy";
import { servicePages, type ServiceCopy } from "@/modules/homepage/lib/service-pages";

type Faq = { q: string; a: string }[];

export type PortraitCopy = Pick<ServiceCopy, "title" | "description" | "intro" | "steps" | "pricing"> & {
  kicker: string;
  heroTitle: string;
  cta: string;
  processTitle: string;
  lightQuestion: string;
};

export type BrandCopy = ServiceCopy & {
  kicker: string;
  cta: string;
  audienceTitle: string;
  workTitle: string;
  workLink: string;
  stepsTitle: string;
  preparationTitle: string;
  deliveryTitle: string;
  faqTitle: string;
  contactTitle: string;
  aboutLink: string;
};

export type PageCopy = {
  home: {
    title: string;
    intro: string;
    creative: string;
    business: string;
    events: string;
    work: string;
    aboutKicker: string;
    about: string;
    aboutLink: string;
    tools: string;
    foceni101Desc: string;
    foceni101Cta: string;
    plannerCta: string;
    plannerNotice: string;
    contact: string;
  };
  portrait: PortraitCopy;
  brand: BrandCopy;
  business: BusinessCopy;
  events: {
    metaTitle: string;
    metaDescription: string;
    kicker: string;
    cta: string;
    infoTitle: string;
    infoText: string;
    larpLink: string;
    pricingTitle: string;
  };
  services: {
    kicker: string;
    title: string;
    subtitle: string;
    select: string;
    faqTitle: string;
    faq: Faq;
    contactTitle: string;
    contactSubtitle: string;
  };
  about: { eyebrow: string; portfolioLink: string; servicesLink: string };
};

type Locale = "cs" | "en";

const portraitService = (l: Locale) => {
  const { title, description, intro, steps, pricing } = servicePages["portretni-foceni"][l];
  return { title, description, intro, steps: [...steps], pricing };
};

const brandService = (l: Locale): ServiceCopy => {
  const page = servicePages["brandove-foceni"][l];
  return { ...page, steps: [...page.steps], questions: page.questions.map((q) => ({ ...q })) };
};

// FAQ answers stay consistent with VOP (storno, delivery, postprodukce) — update both together
const SERVICES_FAQ: Record<Locale, Faq> = {
  cs: [
    { q: "Jak probíhá objednávka focení?", a: "Objednávka probíhá elektronicky: přes kontaktní formulář, e-mailem nebo přes sociální sítě. Domluvíme si termín, rozsah a balíček; termín je závazně rezervován po uhrazení rezervačního poplatku." },
    { q: "Kde focení probíhá?", a: "V Praze a okolí, v ateliéru, v exteriéru nebo u vás. Po domluvě fotím po celé České republice." },
    { q: "Kdy a jak dostanu fotografie?", a: "Termín dodání sjednáváme individuálně podle rozsahu zakázky. Hotové fotografie předávám zabezpečeným odkazem na online galerii; odkaz platí 3 měsíce a v archivu fotky držím 6 měsíců od předání." },
    { q: "Upravujete fotografie?", a: "Ano, všechny odevzdané fotografie procházejí autorskou postprodukcí (barevné korekce, expozice, ořez). Nadstandardní retuše jsou možné po dohodě za příplatek. Neupravené RAW soubory nepředávám." },
    { q: "Co když potřebuji termín zrušit?", a: "Při zrušení méně než 14 dní před termínem propadá rezervační poplatek jako náhrada za blokaci termínu. Dřívější zrušení či přesun řešíme dohodou, u špatného počasí v exteriéru se bez sankcí domluvíme na náhradním termínu." },
    { q: "Kolik focení stojí?", a: "Ceny se odvíjejí od balíčků výše na této stránce. Pro eventy, larpy a nestandardní zakázky připravím nabídku na míru." },
  ],
  en: [
    { q: "How do I book a shoot?", a: "Booking is electronic: via the contact form, e-mail or social media. We agree on a date, scope and package; the date is confirmed once the booking fee is paid." },
    { q: "Where do shoots take place?", a: "In and around Prague, in a studio, outdoors or at your place. Shoots across the Czech Republic are possible by arrangement." },
    { q: "When and how do I get my photos?", a: "Delivery time is agreed individually based on the scope of the job. Finished photos are delivered via a secure online gallery link valid for 3 months; I keep them archived for 6 months after delivery." },
    { q: "Do you edit the photos?", a: "Yes, all delivered photos go through my post-production (colour correction, exposure, cropping). Advanced retouching is available by agreement for an extra fee. I do not hand over unedited RAW files." },
    { q: "What if I need to cancel?", a: "Cancelling less than 14 days before the date forfeits the booking fee as compensation for blocking the slot. Earlier cancellations or reschedules are handled by agreement; bad weather for outdoor shoots means we simply pick a new date." },
    { q: "How much does a shoot cost?", a: "Prices follow the packages above. For events, larps and custom jobs I prepare a tailored quote." },
  ],
};

const DEFAULTS: Record<Locale, PageCopy> = {
  cs: {
    home: {
      title: "Jiný pohled.",
      intro: "Portréty s charakterem. Příběhy v obrazech.",
      creative: "Kreativní portrét",
      business: "Business portrét",
      events: "Eventy a svatby",
      work: "Vybrané příběhy",
      aboutKicker: "Za fotoaparátem",
      about: "Zajímá mě člověk. Ne dokonalá póza.",
      aboutLink: "Více o mně",
      tools: "Dva nástroje pro tvůj lepší pohled.",
      foceni101Desc: "Prozkoumej, co ve fotografii dělá světlo, expozice a kompozice.",
      foceni101Cta: "Vyzkoušet",
      plannerCta: "Otevřít plánovač",
      plannerNotice: "Plánovač funguje na větší obrazovce.",
      contact: "Co spolu vytvoříme?",
    },
    portrait: {
      ...portraitService("cs"),
      kicker: "Kreativní portrét",
      heroTitle: "Tvoje tvář. Jinak.",
      cta: "Domluvit portrét",
      processTitle: "Prostor pro tvůj výraz.",
      lightQuestion: "Chceš před focením pochopit, jak pracuji se světlem?",
    },
    brand: {
      ...brandService("cs"),
      kicker: "Guth Pictures · Praha",
      cta: "Domluvit focení",
      audienceTitle: "Pro koho je focení",
      workTitle: "Ukázky portrétní tvorby",
      workLink: "Celé portfolio",
      stepsTitle: "Jak focení probíhá",
      preparationTitle: "Co připravit před focením",
      deliveryTitle: "Co dostanete",
      faqTitle: "Časté otázky",
      contactTitle: "Napište mi o svém focení",
      aboutLink: "O fotografovi",
    },
    business: { ...structuredClone(BUSINESS_COPY.cs), heroTitle: "Tvoje práce. Tvoje tvář." },
    events: {
      metaTitle: "Eventy a svatby",
      metaDescription: "Reportážní focení eventů a svateb v Praze a celé ČR.",
      kicker: "Eventy a svatby",
      cta: "Poptat termín",
      infoTitle: "Lidé. Dění. Atmosféra.",
      infoText: "Skutečné momenty tak, jak se dějí. Bez aranžmá a bez přetvářky.",
      larpLink: "Larpové projekty v portfoliu",
      pricingTitle: "Svatby a oslavy",
    },
    services: {
      kicker: "Fotografické služby",
      title: "Služby",
      subtitle: "Co pro vás mohu zachytit",
      select: "Mám zájem",
      faqTitle: "Časté dotazy",
      faq: SERVICES_FAQ.cs,
      contactTitle: "Kontakt",
      contactSubtitle: "Napište mi",
    },
    about: { eyebrow: "Fotograf", portfolioLink: "Portfolio", servicesLink: "Služby" },
  },
  en: {
    home: {
      title: "A different view.",
      intro: "Portraits with character. Stories in images.",
      creative: "Creative portrait",
      business: "Business portrait",
      events: "Events & weddings",
      work: "Selected stories",
      aboutKicker: "Behind the camera",
      about: "I care about the person. Not a perfect pose.",
      aboutLink: "More about me",
      tools: "Two tools for a better view.",
      foceni101Desc: "Explore how light, exposure and composition shape a photograph.",
      foceni101Cta: "Try it",
      plannerCta: "Open planner",
      plannerNotice: "The planner requires a larger screen.",
      contact: "What will we create?",
    },
    portrait: {
      ...portraitService("en"),
      kicker: "Creative portrait",
      heroTitle: "Your face. Seen differently.",
      cta: "Book a portrait",
      processTitle: "Room for your expression.",
      lightQuestion: "Want to understand how I work with light before the shoot?",
    },
    brand: {
      ...brandService("en"),
      kicker: "Guth Pictures · Prague",
      cta: "Enquire about a session",
      audienceTitle: "Who the session is for",
      workTitle: "Selected portrait work",
      workLink: "Full portfolio",
      stepsTitle: "How it works",
      preparationTitle: "How to prepare",
      deliveryTitle: "What you receive",
      faqTitle: "Common questions",
      contactTitle: "Tell me about your session",
      aboutLink: "About the photographer",
    },
    business: { ...structuredClone(BUSINESS_COPY.en), heroTitle: "Your work. Your face." },
    events: {
      metaTitle: "Events & weddings",
      metaDescription: "Documentary event and wedding photography in Prague and across the Czech Republic.",
      kicker: "Events & weddings",
      cta: "Ask about a date",
      infoTitle: "People. Action. Atmosphere.",
      infoText: "Real moments as they happen. Unstaged and honest.",
      larpLink: "Larp projects in the portfolio",
      pricingTitle: "Weddings and celebrations",
    },
    services: {
      kicker: "Photography services",
      title: "Services",
      subtitle: "What I can capture for you",
      select: "I'm interested",
      faqTitle: "FAQ",
      faq: SERVICES_FAQ.en,
      contactTitle: "Contact",
      contactSubtitle: "Write to me",
    },
    about: { eyebrow: "Photographer", portfolioLink: "Portfolio", servicesLink: "Services" },
  },
};

export const defaultPageCopy = (locale: string): PageCopy =>
  structuredClone(DEFAULTS[locale === "en" ? "en" : "cs"]);

type Tree = string | Tree[] | { [key: string]: Tree };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

// Template decides the shape; stored values win where their type matches.
function merge(stored: unknown, template: Tree): Tree {
  if (typeof template === "string") return typeof stored === "string" ? stored : template;
  if (Array.isArray(template)) {
    if (!Array.isArray(stored)) return template;
    const item = template[0];
    return item === undefined ? template : stored.map((entry, i) => merge(entry, template[i] ?? item));
  }
  const source = isRecord(stored) ? stored : {};
  return Object.fromEntries(Object.entries(template).map(([key, value]) => [key, merge(source[key], value)]));
}

export function normalizePageCopy(stored: unknown, locale: string): PageCopy {
  return merge(stored, defaultPageCopy(locale) as unknown as Tree) as unknown as PageCopy;
}

export const MAX_COPY_TEXT = 2000;
export const MAX_COPY_ITEMS = 30;

// Partial input is fine (normalizePageCopy fills gaps); unknown keys and wrong types are not.
function matches(value: unknown, template: Tree): boolean {
  if (typeof template === "string") return typeof value === "string" && value.length <= MAX_COPY_TEXT;
  if (Array.isArray(template)) {
    const item = template[0];
    return item !== undefined && Array.isArray(value) && value.length <= MAX_COPY_ITEMS
      && value.every((entry) => matches(entry, item));
  }
  if (!isRecord(value)) return false;
  return Object.entries(value).every(([key, entry]) => Object.hasOwn(template, key) && matches(entry, template[key]));
}

export function isValidPageCopy(value: unknown): value is Partial<PageCopy> {
  return matches(value, DEFAULTS.cs as unknown as Tree);
}
