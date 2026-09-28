// Static copy for /[locale]/firemni-portrety. Prices live in admin content (sluzby.business).
// FAQ answers mirror docs/smlouva-business-portrety.md (licence, storno, delivery) — update both together.

// Cloudinary public IDs. Empty string = hatch placeholder until real photos exist.
// [0] = hero, rest = grid (keep grid a multiple of 3)
export const HEADSHOT_IDS: string[] = ["", "", "", "", "", "", ""];
export const AT_WORK_IDS: string[] = ["", "", ""];

export type Copy = {
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
  useCasesTitle: string;
  useCases: { title: string; desc: string }[];
  headshotsTitle: string;
  headshotsDesc: string;
  atWorkTitle: string;
  atWorkDesc: string;
  stepsTitle: string;
  steps: { title: string; desc: string }[];
  pricingTitle: string;
  extrasTitle: string;
  select: string;
  faqTitle: string;
  faq: { q: string; a: string }[];
  contactTitle: string;
  contactSubtitle: string;
  placeholder: string;
};

export const COPY: Record<"cs" | "en", Copy> = {
  cs: {
    eyebrow: "Firemní portréty",
    heroTitle: "Portréty pro web a LinkedIn, nafocené u vás ve firmě.",
    heroSubtitle: "Na jednoho člověka stačí deset minut. Hotové fotky pošlu do deseti pracovních dnů.",
    heroCta: "Poptat focení",
    useCasesTitle: "K čemu je využijete",
    useCases: [
      { title: "Web a sekce O nás", desc: "Tým, který vypadá jako jeden celek, ne jako koláž z dovolených." },
      { title: "LinkedIn a média", desc: "Profilovky, tiskové zprávy, rozhovory, podklady pro konference." },
      { title: "Noví kolegové", desc: "Nástup nového člověka? Dofotím ho ve stejném stylu jako zbytek týmu." },
    ],
    headshotsTitle: "Headshoty",
    headshotsDesc: "Stejné světlo, pozadí i ořez pro všechny. Deset minut na osobu, žádné čekání u fotografa.",
    atWorkTitle: "Firma v akci",
    atWorkDesc: "Kromě portrétů nafotím i váš tým při práci, prostory a detaily firmy. Pro web, kariérní stránky i výroční zprávy.",
    stepsTitle: "Jak to probíhá",
    steps: [
      { title: "Poptávka", desc: "Napíšete počet lidí a termín, do 24 hodin pošlu nabídku." },
      { title: "Focení u vás", desc: "Postavím mobilní ateliér, stačí místnost zhruba 3 × 4 m. Na osobu 10–15 minut." },
      { title: "Výběr", desc: "Do 5 pracovních dnů dostanete online galerii, každý si vybere 2 fotky." },
      { title: "Dodání", desc: "Retušované fotky pošlu do 10 pracovních dnů od výběru." },
    ],
    pricingTitle: "Ceník",
    extrasTitle: "Příplatky",
    select: "Mám zájem",
    faqTitle: "Časté dotazy",
    faq: [
      { q: "Co si vzít na sebe?", a: "Oblečení, ve kterém chodíte na důležité schůzky. Jednobarevné kusy fungují lépe než výrazné vzory. Před focením pošlu krátký návod." },
      { q: "Můžeme fotky ořezat a použít kdekoli?", a: "Ano. Licence v ceně pokrývá web, sociální sítě, tiskoviny i předání médiím. Ořez, změna velikosti a převod do černobílé jsou v pořádku. Retuš vzhledu a AI úpravy prosím nechte na mně." },
      { q: "Můžeme fotky použít v placené reklamě?", a: "Na placenou reklamu, billboardy nebo obaly je potřeba rozšířená licence za příplatek." },
      { q: "Co když někdo v den focení chybí?", a: "Dofotím ho později ve stejném stylu, aby série zůstala jednotná." },
      { q: "Jak funguje záloha a storno?", a: "Termín potvrdí záloha 50 %. Při zrušení víc než 14 dní předem ji vracím. Jeden přesun termínu do 7 dní předem je zdarma." },
      { q: "Dostaneme i neupravené fotky?", a: "Ne, RAW soubory nepředávám. Dostanete retušované fotky ve vysokém rozlišení pro web i tisk." },
    ],
    contactTitle: "Poptat focení",
    contactSubtitle: "Napište název firmy, počet lidí a představu o termínu. Do 24 hodin se ozvu s nabídkou.",
    placeholder: "Ukázka brzy",
  },
  en: {
    eyebrow: "Business portraits",
    heroTitle: "Portraits for your website and LinkedIn, shot at your office.",
    heroSubtitle: "Ten minutes per person is enough. I'll send the finished photos within ten working days.",
    heroCta: "Request a quote",
    useCasesTitle: "What they're for",
    useCases: [
      { title: "Website and About page", desc: "A team that looks like one team, not a collage of holiday snaps." },
      { title: "LinkedIn and press", desc: "Profile photos, press releases, interviews, conference materials." },
      { title: "New hires", desc: "Someone new joined? I'll shoot them in the same style as the rest of the team." },
    ],
    headshotsTitle: "Headshots",
    headshotsDesc: "Same light, background and crop for everyone. Ten minutes per person, no queue at the photographer.",
    atWorkTitle: "Company at work",
    atWorkDesc: "Besides portraits I can photograph your team at work, your spaces and details. For websites, career pages and annual reports.",
    stepsTitle: "How it works",
    steps: [
      { title: "Enquiry", desc: "Tell me the headcount and date, I'll send a quote within 24 hours." },
      { title: "Shoot at your office", desc: "I set up a mobile studio, a room of about 3 × 4 m is enough. 10–15 minutes per person." },
      { title: "Selection", desc: "Within 5 working days you get an online gallery, everyone picks 2 photos." },
      { title: "Delivery", desc: "Retouched photos arrive within 10 working days of your selection." },
    ],
    pricingTitle: "Pricing",
    extrasTitle: "Extras",
    select: "I'm interested",
    faqTitle: "FAQ",
    faq: [
      { q: "What should we wear?", a: "What you'd wear to an important meeting. Solid colours work better than bold patterns. I'll send a short guide before the shoot." },
      { q: "Can we crop the photos and use them anywhere?", a: "Yes. The included licence covers web, social media, print and sharing with the press. Cropping, resizing and black-and-white are fine. Please leave appearance retouching and AI edits to me." },
      { q: "Can we use the photos in paid advertising?", a: "Paid ads, billboards or packaging need the extended licence for an extra fee." },
      { q: "What if someone is away on the day?", a: "I'll shoot them later in the same style so the series stays consistent." },
      { q: "How do the deposit and cancellation work?", a: "A 50 % deposit confirms the date. Cancel more than 14 days ahead and I refund it. One reschedule up to 7 days before is free." },
      { q: "Do we get the unedited photos?", a: "No, I don't hand over RAW files. You get retouched high-resolution photos for web and print." },
    ],
    contactTitle: "Request a quote",
    contactSubtitle: "Send your company name, headcount and preferred date. I'll get back to you with a quote within 24 hours.",
    placeholder: "Sample coming soon",
  },
};
