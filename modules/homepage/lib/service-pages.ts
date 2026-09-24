type ServiceCopy = {
  title: string;
  description: string;
  intro: string;
  audience: string;
  steps: [string, string, string];
  preparation: string;
  delivery: string;
  pricing: string;
  questions: { q: string; a: string }[];
};

export const serviceSlugs = ["portretni-foceni", "brandove-foceni"] as const;
export type ServiceSlug = typeof serviceSlugs[number];
export const isServiceSlug = (value: string): value is ServiceSlug =>
  serviceSlugs.some((slug) => slug === value);

export const servicePages: Record<ServiceSlug, Record<"cs" | "en", ServiceCopy>> = {
  "portretni-foceni": {
    cs: {
      title: "Portrétní focení v Praze",
      description: "Portrétní focení s Tomášem Guthem Jarkovským v Praze: ateliér i exteriér, příprava, průběh a aktuální balíčky Guth Pictures.",
      intro: "Portrét může být civilní, výrazný i hravý. Jsem Tomáš Guth Jarkovský a v Praze fotím jednotlivce i skupiny, v ateliéru, venku nebo ve vašem prostředí. Směr focení hledáme podle toho, jak se chcete na fotografiích vidět a k čemu je použijete.",
      audience: "Pro vás, pokud chcete osobní portrét, nové profilové fotografie nebo si vyzkoušet kreativní focení. Zkušenost před objektivem není podmínkou; předem si můžeme říct, co je vám příjemné a co zkoušet nechcete.",
      steps: [
        "Napište, k čemu fotografie potřebujete, jaký styl vás zajímá a kdy máte čas. Pomůže i několik referenčních fotografií.",
        "Domluvíme prostředí, oblečení, rozsah a balíček. V ateliéru můžeme pracovat se světlem; venku počítáme s místem a počasím.",
        "Po focení následuje výběr a autorská úprava fotografií. Rozsah a termín předání si potvrdíme podle zakázky.",
      ],
      preparation: "Vezměte oblečení, ve kterém se cítíte dobře. Pokud váháte mezi dvěma variantami, pošlete je předem. Místo obecného seznamu správných póz je užitečnější vědět, jakou náladu má portrét mít a kde ho chcete používat.",
      delivery: "Počet upravených fotografií a délku focení najdete u jednotlivých balíčků. Hotové fotografie předávám v online galerii; termín dodání domlouváme individuálně. Neupravené RAW soubory nepředávám.",
      pricing: "Aktuální portrétní balíčky",
      questions: [
        { q: "Musím umět pózovat?", a: "Nemusíte přicházet s připravenými pózami. Při domluvě probereme vaše představy a obavy, aby focení odpovídalo tomu, co je vám příjemné." },
        { q: "Ateliér, nebo venkovní focení?", a: "Ateliér dává prostor práci se světlem a pozadím. Exteriér přidává prostředí a přirozené světlo. Volbu přizpůsobíme zamýšlenému portrétu a u venkovního focení také počasí." },
        { q: "Potřebuji fotky pro podnikání. Je to stejná služba?", a: "Pokud mají fotografie systematicky představovat vaši práci nebo značku, podívejte se na brandové focení. To začíná účelem fotografií a přípravou vizuálního konceptu." },
      ],
    },
    en: {
      title: "Portrait photography in Prague",
      description: "Portrait sessions with Tomáš Guth Jarkovský in Prague: studio and outdoor photography, preparation, process and current Guth Pictures packages.",
      intro: "A portrait can be understated, expressive or playful. I am Tomáš Guth Jarkovský, a Prague-based photographer working with individuals and groups in studios, outdoors and in your own setting. We choose a direction around how you want to be portrayed and where you will use the photographs.",
      audience: "For personal portraits, updated profile photographs or a creative session. You do not need experience in front of a camera. We can discuss what feels comfortable and what you would rather avoid before the shoot.",
      steps: [
        "Tell me what the photographs are for, the style you have in mind and your preferred dates. A few reference images can help.",
        "We agree on the setting, wardrobe, scope and package. A studio allows controlled lighting; an outdoor session also depends on the location and weather.",
        "The session is followed by selection and editing. We confirm the deliverables and delivery date for your booking.",
      ],
      preparation: "Choose clothing you feel comfortable in. Send your options beforehand if you are unsure. Rather than preparing a list of poses, think about the mood you want and where the photographs will be used.",
      delivery: "Each package specifies the session length and number of edited photographs. Finished images are delivered through an online gallery, with timing agreed individually. Unedited RAW files are not provided.",
      pricing: "Current portrait packages",
      questions: [
        { q: "Do I need to know how to pose?", a: "You do not need to arrive with prepared poses. We discuss your ideas and concerns beforehand so the session fits what feels comfortable for you." },
        { q: "Should I choose a studio or an outdoor session?", a: "A studio lets us shape the lighting and background. An outdoor location adds surroundings and natural light. We choose based on the portrait you want and, outdoors, the weather." },
        { q: "What if I need photographs for my business?", a: "If you need a set of photographs to communicate your work or brand, explore brand photography. It starts with the intended use and a visual concept." },
      ],
    },
  },
  "brandove-foceni": {
    cs: {
      title: "Brandové focení v Praze",
      description: "Fotografie pro osobní značku, web a profesní profil. Brandové focení Guth Pictures v Praze začíná přípravou konceptu, barev a moodboardu.",
      intro: "Fotografie pro značku mají vycházet z toho, kdo jste, co děláte a komu se představujete. Jsem Tomáš Guth Jarkovský. Pro brandové focení propojuji přípravu vizuálního konceptu s portrétní fotografií v Praze a po domluvě i jinde v ČR.",
      audience: "Pro podnikatele, specialisty a tvůrce, kteří potřebují fotografie pro web, LinkedIn nebo komunikaci své práce. Hodí se, pokud chcete promyšlený soubor fotografií pro více použití, nejen jeden profilový portrét.",
      steps: [
        "Začneme vaším webem nebo profesním profilem a účelem fotografií. Probereme publikum, zamýšlené použití a to, co má být na fotkách rozpoznatelné.",
        "Připravím varianty kreativního směru: koncept, barvy, moodboard a inspiraci pro pózy. Společně vybereme směr a domluvíme prostředí, oblečení a seznam záběrů.",
        "Focení naváže na schválenou přípravu. Rozsah výběru, úprav, formáty a termín předání si sjednáme pro konkrétní zakázku.",
      ],
      preparation: "Pošlete odkaz na svůj web nebo LinkedIn a popište, kde budou fotografie použité. Pomohou i rozměry webových ploch, barvy značky a příklady toho, co vám sedí nebo nesedí. Moodboard slouží ke společné domluvě, není hotovým výsledkem focení.",
      delivery: "Konkrétní počet fotografií, rozsah postprodukce a podmínky použití jsou součástí domluvené nabídky. Výsledné fotografie předávám přes online galerii. Před focením si potvrdíme také požadované formáty a termín.",
      pricing: "Cena podle rozsahu zakázky",
      questions: [
        { q: "Čím se brandové focení liší od portrétu?", a: "Portrét se soustředí na vás. Brandové focení navíc řeší, co má fotografie sdělit o vaší práci a kde bude fungovat. Proto přípravě předchází domluva o publiku, použití a vizuálním směru." },
        { q: "Musím už mít hotovou vizuální identitu?", a: "Pokud ji máte, vezmeme ji jako podklad. Pokud ne, můžeme hledat vizuální směr pro focení pomocí konceptů, barev a referencí. Návrh focení nenahrazuje kompletní tvorbu značky." },
        { q: "Kolik brandové focení stojí?", a: "Nabídku připravím podle přípravy, délky focení, prostředí a požadovaných výstupů. Pošlete mi účel fotografií a představu rozsahu; cenu si potvrdíme před rezervací." },
      ],
    },
    en: {
      title: "Personal brand photography in Prague",
      description: "Photography for your personal brand, website and professional profile. Guth Pictures brand sessions in Prague start with a concept, colours and moodboard.",
      intro: "Brand photographs should reflect who you are, what you do and who you want to reach. I am Tomáš Guth Jarkovský. I combine visual concept preparation with portrait photography in Prague and elsewhere in the Czech Republic by arrangement.",
      audience: "For independent professionals, business owners and creatives who need photographs for a website, LinkedIn or their work. A good fit when you need a considered set of images for several uses, rather than a single profile portrait.",
      steps: [
        "We start with your website or professional profile and the purpose of the photographs. We discuss your audience, intended use and what the images should communicate.",
        "I prepare creative directions: concepts, colours, a moodboard and posing references. Together we select a direction and agree on the setting, wardrobe and shot list.",
        "The session follows the approved preparation. Image selection, editing, formats and delivery timing are agreed for your project.",
      ],
      preparation: "Send your website or LinkedIn profile and describe where you will use the images. Website image dimensions, brand colours and examples of what you like or dislike are useful. The moodboard helps us agree on a direction; it is not the finished photography.",
      delivery: "The number of photographs, editing scope and usage terms are included in the agreed proposal. Finished photographs are delivered through an online gallery. We also confirm the required formats and delivery date before the shoot.",
      pricing: "A quote tailored to your project",
      questions: [
        { q: "How is brand photography different from a portrait session?", a: "A portrait focuses on you. Brand photography also considers what the images communicate about your work and where they will be used. Preparation therefore starts with your audience, intended use and visual direction." },
        { q: "Do I need an existing visual identity?", a: "If you have one, we use it as a reference. Otherwise, concepts, colours and references can help us find a direction for the shoot. A photography concept does not replace a complete brand identity." },
        { q: "How much does a brand session cost?", a: "The quote depends on preparation, session length, location and deliverables. Send the intended use and approximate scope; we confirm the price before booking." },
      ],
    },
  },
};
