import type { Section } from "./types";

// ── Value formatters (exact, real units) ──────────────────────────────────────
/** Exposure multiplier (0.2..2) → EV relative to correct. +1 EV = 2× světla. */
export const fmtEv = (v: number) => `${Math.log2(v) >= 0 ? "+" : ""}${Math.log2(v).toFixed(1)} EV`;
/** Shutter "slowness" param 0..1 → real exposure time (1/1000 s .. 1 s). */
export function fmtShutter(v: number): string {
  const t = Math.pow(1000, v) / 1000; // seconds
  return t >= 1 ? `${t.toFixed(t < 2 ? 1 : 0)} s` : `1/${Math.round(1 / t)} s`;
}
export const fmtIso = (v: number) => `ISO ${Math.round(v)}`;

export const SECTIONS: Section[] = [
  {
    id: "intro",
    num: "00",
    title: "Scéna",
    body:
      "Hlava, jedno hlavní světlo, pozadí. Z jedné scény vznikne pokaždé jiná fotka — podle toho, jak nastavíš foťák. Scrolluj dolů a zkoušej posuvníky.",
    target: { exposure: 1, aperture: 5.6, shutter: 0, iso: 100, focal: 50 },
  },
  {
    id: "expozice",
    num: "01",
    title: "Expozice",
    body:
      "Expozice je celkové množství světla, které dopadne na snímač. Málo světla → tmavá fotka, moc → přepálená. Posuvník mění expozici v EV; +1 EV znamená dvojnásobek světla.",
    target: { exposure: 1 },
    control: {
      param: "exposure",
      min: 0.2,
      max: 2,
      step: 0.01,
      label: "Expozice",
      fmt: fmtEv,
    },
  },
  {
    id: "clona",
    num: "02",
    title: "Clona",
    body:
      "Clona je otvor v objektivu, udává se clonovým číslem f. Nízké číslo (f/1.4) = velký otvor a malá hloubka ostrosti: ostrý subjekt, rozostřené pozadí. Vysoké číslo (f/16) = velká hloubka ostrosti, ostré je popředí i pozadí.",
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
    title: "Čas závěrky",
    body:
      "Čas závěrky je doba, po kterou na snímač dopadá světlo. Krátký čas (1/1000 s) zmrazí pohyb, dlouhý (1/15 s a delší) ho rozmaže do šmouhy. Sleduj kuličku obíhající kolem hlavy.",
    target: { shutter: 0 },
    holdLight: true,
    control: {
      param: "shutter",
      min: 0,
      max: 1,
      step: 0.01,
      label: "Čas závěrky",
      fmt: fmtShutter,
    },
  },
  {
    id: "iso",
    num: "04",
    title: "ISO",
    body:
      "ISO je citlivost snímače. Vyšší hodnota fotku zesvětlí, když je málo světla, ale přidá šum (zrno). Drží se proto co nejníž, jak to dané světlo dovolí.",
    target: { iso: 100 },
    holdLight: true,
    control: {
      param: "iso",
      min: 100,
      max: 6400,
      step: 100,
      label: "ISO",
      fmt: fmtIso,
    },
  },
  {
    id: "ohnisko",
    num: "05",
    title: "Ohnisko",
    body:
      "Ohnisková vzdálenost (v mm) určuje zorný úhel. Když měníš ohnisko a zároveň vzdálenost tak, aby byl subjekt stále stejně velký, mění se perspektiva: kratší ohnisko zblízka roztáhne bližší rysy, delší ohnisko z dálky perspektivu stlačí. Volíš tím vztah mezi obličejem a pozadím.",
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
    title: "Úhel pohledu",
    body:
      "Výška kamery vůči subjektu. Pohled zdola subjekt opticky zvětší, pohled shora ho zmenší, úroveň očí je neutrální. Je to nástroj pro vyznění záběru, ne pravidlo.",
    target: { angle: -0.5 },
    control: {
      param: "angle",
      min: -1,
      max: 1,
      step: 0.01,
      label: "Výška kamery",
      fmt: (v) => (v < -0.3 ? "podhled" : v > 0.3 ? "nadhled" : "úroveň očí"),
    },
  },
  {
    id: "wb",
    num: "07",
    title: "Vyvážení bílé",
    body:
      "Vyvážení bílé určuje, jakou teplotu světla foťák považuje za neutrální (v kelvinech). Nižší hodnota nechá fotku teplejší (oranžovou), vyšší studenější (modrou). Nastavuje se podle zdroje světla.",
    target: { whiteBalance: 4200 },
    control: {
      param: "whiteBalance",
      min: 3000,
      max: 8000,
      step: 50,
      label: "Teplota",
      fmt: (v) => `${Math.round(v)} K`,
    },
  },
  {
    id: "kompozice",
    num: "08",
    title: "Kompozice",
    body:
      "Umístění subjektu v záběru. Pravidlo třetin radí položit subjekt na třetinovou čáru místo do středu — je to výchozí vodítko, ne zákon. Posuň hlavu a sleduj mřížku.",
    target: { composition: 0.5 },
    control: {
      param: "composition",
      min: -1,
      max: 1,
      step: 0.01,
      label: "Umístění",
      fmt: (v) => (v < -0.2 ? "levá třetina" : v > 0.2 ? "pravá třetina" : "střed"),
    },
  },
  {
    id: "svetlo",
    num: "09",
    title: "Expoziční trojúhelník",
    body:
      "Clona, čas a ISO neovlivňují jen vzhled — všechny tři zároveň mění množství světla. Otevři clonu a sleduj ukazatel expozice dole: fotka se přesvětlí. Čas a ISO se chovají stejně.",
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
    title: "Vyrovnej expozici",
    body:
      "Clona je zamčená na f/1.4 kvůli rozostřenému pozadí, takže dopadá hodně světla a fotka je přepálená. Stáhni čas a ISO, dokud ukazatel nesedne na nulu. Delší čas vykompenzuješ nižším ISO a naopak — to je ten kompromis.",
    target: { aperture: 1.4 },
    meter: true,
    capstone: true,
  },
];
