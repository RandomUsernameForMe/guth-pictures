import type { Section } from "./types";

// MVP = sekce 0–5. Hravý, lidský tón, žádný žargon.
export const SECTIONS: Section[] = [
  {
    id: "intro",
    num: "00",
    title: "Tohle je scéna",
    body:
      "Hlava, světlo, pozadí. Z týhle jedný scény uděláme úplně jinou fotku — jen tím, co zmáčkneme na foťáku. Scrolluj dolů a hraj si s posuvníky. Uvidíš, co každá věc dělá.",
    target: { exposure: 1, aperture: 5.6, shutter: 0, iso: 100, focal: 50 },
  },
  {
    id: "expozice",
    num: "01",
    title: "Světlo a jas",
    body:
      "Foťák je v jádru kýbl na světlo. Málo světla → tmavá fotka. Moc → přepálená, bílá. Profík hlídá, aby toho světla bylo akorát. Zkus to — sjeď posuvník dolů a nahoru.",
    target: { exposure: 1 },
    control: {
      param: "exposure",
      min: 0.2,
      max: 2,
      step: 0.01,
      label: "Množství světla",
      fmt: (v) => (v < 0.7 ? "tma" : v > 1.4 ? "přepal" : "akorát"),
    },
  },
  {
    id: "clona",
    num: "02",
    title: "Clona = rozmazané pozadí",
    body:
      "Tohle je ten trik, proč portrét od profíka „vyskočí“. Otevřená clona (malé číslo f) rozmaže pozadí na hebkou kaši a oddělí člověka od okolí. Zavřená clona (velké f) nechá ostré všechno.",
    target: { aperture: 1.4 },
    holdLight: true,
    control: {
      param: "aperture",
      min: 1.4,
      max: 16,
      step: 0.1,
      label: "Clona",
      fmt: (v) => `f/${v.toFixed(1)}`,
      invert: true,
    },
  },
  {
    id: "cas",
    num: "03",
    title: "Čas závěrky = pohyb",
    body:
      "Jak dlouho foťák „kouká“. Krátký čas zmrazí i běžící psa. Dlouhý čas pohyb rozmaže do efektní šmouhy. Sleduj tu kuličku, co krouží kolem hlavy.",
    target: { shutter: 0 },
    holdLight: true,
    control: {
      param: "shutter",
      min: 0,
      max: 1,
      step: 0.01,
      label: "Čas závěrky",
      fmt: (v) => (v < 0.15 ? "rychlý (ostré)" : v > 0.6 ? "dlouhý (šmouha)" : "střední"),
    },
  },
  {
    id: "iso",
    num: "04",
    title: "ISO = záchrana ve tmě",
    body:
      "Když je málo světla, ISO uměle zesílí signál a fotka je světlejší. Daň za to je zrno — ten „šum“, co znáš z nočních fotek z mobilu. Profík drží ISO co nejníž.",
    target: { iso: 100 },
    holdLight: true,
    control: {
      param: "iso",
      min: 100,
      max: 6400,
      step: 100,
      label: "ISO",
      fmt: (v) => `${Math.round(v)}`,
    },
  },
  {
    id: "ohnisko",
    num: "05",
    title: "Ohnisko = jak moc lichotí",
    body:
      "Širokáč (malé mm) zblízka natáhne nos a uši — proto selfie nikdy nevypadá jako ty. Teleobjektiv (velké mm) z dálky obličej zploští a zkrášlí. Proto se portréty fotí na „85“.",
    target: { focal: 50 },
    control: {
      param: "focal",
      min: 24,
      max: 135,
      step: 1,
      label: "Ohnisko",
      fmt: (v) => `${Math.round(v)} mm`,
    },
  },
  {
    id: "uhel",
    num: "06",
    title: "Úhel = kdo je tady šéf",
    body:
      "Foťák dole a koukáš nahoru → člověk působí jako hrdina, mocně. Foťák nahoře a koukáš dolů → působí menší a křehčí. Stejná hlava, úplně jiný dojem. Zkus to.",
    target: { angle: -0.5 },
    control: {
      param: "angle",
      min: -1,
      max: 1,
      step: 0.01,
      label: "Úhel kamery",
      fmt: (v) => (v < -0.3 ? "zespoda (hrdina)" : v > 0.3 ? "shora (drobek)" : "z očí do očí"),
    },
  },
  {
    id: "wb",
    num: "07",
    title: "Vyvážení bílé = nálada",
    body:
      "Tahle volba ladí barvy do tepla, nebo do chladu. Teplá = útulno, večer, intimně. Studená = čisto, ráno, odtažitě. Není to o správně či špatně — je to o pocitu, co fotka vyvolá.",
    target: { whiteBalance: 4200 },
    control: {
      param: "whiteBalance",
      min: 3000,
      max: 8000,
      step: 50,
      label: "Teplota barev",
      fmt: (v) => (v < 4500 ? "teplá" : v > 6500 ? "studená" : "neutrální"),
    },
  },
  {
    id: "kompozice",
    num: "08",
    title: "Kompozice = kam ho postavit",
    body:
      "Profík málokdy cpe člověka přesně doprostřed. Pomyslně rozdělí obraz na třetiny a postaví ho na čáru — působí to živěji a líp se na to kouká. Posuň hlavu a sleduj mřížku třetin.",
    target: { composition: 0.5 },
    control: {
      param: "composition",
      min: -1,
      max: 1,
      step: 0.01,
      label: "Umístění v záběru",
      fmt: (v) => (v < -0.2 ? "levá třetina" : v > 0.2 ? "pravá třetina" : "na střed"),
    },
  },
  {
    id: "svetlo",
    num: "09",
    title: "Všechno je světlo",
    body:
      "Tady je ten trik, co spojuje předchozí tři. Clona, čas i ISO — každý z nich potají přidává nebo ubírá světlo. Otevři clonu a koukni na ukazatel: fotka začne přepalovat. Čas a ISO dělají úplně to samé.",
    target: { aperture: 5.6 },
    meter: true,
    control: {
      param: "aperture",
      min: 1.4,
      max: 16,
      step: 0.1,
      label: "Clona",
      fmt: (v) => `f/${v.toFixed(1)}`,
      invert: true,
    },
  },
  {
    id: "capstone",
    num: "10",
    title: "Zkus to vybalancovat",
    body:
      "Chceš rozmazané pozadí, tak držíš clonu dokořán (f/1.4). Jenže tím pustíš dovnitř spoustu světla — fotka je přepálená. Stáhni čas a ISO, dokud ukazatel nesedne na střed. Klidně nech čas trochu vejš, když ISO sjedeš níž (nebo naopak) — to je ten obchod.",
    target: { aperture: 1.4 },
    meter: true,
    capstone: true,
  },
];
