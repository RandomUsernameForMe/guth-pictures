import "server-only";
import { getKv } from "@/lib/kv";
import type { PricingPackage } from "@/lib/types";

export type { PricingPackage };

export type ServiceContent = {
  title: string;
  desc: string;
  packages: PricingPackage[];
  extras?: PricingPackage[]; // příplatky — name + price, duration/includes unused
  note?: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role?: string;   // optional — e.g. "Svatba, Praha" / job title
  photo?: string;  // optional — Cloudinary public ID
};

export type ContentData = {
  home: { title: string; subtitle: string };
  "o-mne": { title: string; subtitle: string; bio: string };
  sluzby: {
    portraits: ServiceContent;
    weddings: ServiceContent;
    business: ServiceContent;
  };
  lightTesterPromo: { title: string; desc: string };
  testimonials: Testimonial[];
};

export type SiteImages = {
  profile: string; // Cloudinary public ID
  heroTriptych?: [string[], string[], string[]]; // pole publicIds pro 3 panely hero sekce
};

const defaults: Record<string, ContentData> = {
  cs: {
    home: {
      title: "Guth Pictures",
      subtitle: "Portréty, svatby a larpy. Praha a okolí.",
    },
    "o-mne": {
      title: "O mně",
      subtitle: "Jsem fotograf z Prahy.",
      bio: "Fotím portréty, svatby a larpy. Baví mě zachytit věci tak, jak se opravdu staly, bez přehnaného hraní před objektivem. Cestuji po celé ČR, ale mám základnu v Praze.",
    },
    lightTesterPromo: {
      title: "Vyzkoušej světla před focením",
      desc: "Interaktivní 3D simulátor studiového osvětlení. Nastav si světelné schéma, prozkoumej presety a přijď připravený.",
    },
    sluzby: {
      portraits: {
        title: "Portréty",
        desc: "Individuální i skupinové portréty. V ateliéru, v přírodě nebo u vás. Hlavní je pro mě přirozený výraz.",
        packages: [
          { name: "Základ", price: "2 500 Kč", duration: "1,5 hod", includes: ["7 upravených fotek", "online galerie"] },
          { name: "Rozšířený", price: "4 000 Kč", duration: "2–4 hod", includes: ["15 upravených fotek", "online galerie"] },
        ],
        note: "Ceny bez dopravy mimo Prahu.",
      },
      weddings: {
        title: "Svatby",
        desc: "Celý den od příprav po večer. Fotím reportážně, bez nucených póz.",
        packages: [
          { name: "Základ", price: "8 000 Kč", duration: "4 hod", includes: ["cca 150 fotek", "online galerie", "jeden obřad / část dne"] },
          { name: "Celý den", price: "15 000 Kč", duration: "8–10 hod", includes: ["300+ fotek", "přípravy až po večer", "online galerie"] },
        ],
        note: "Možná záloha 30 % při rezervaci termínu.",
      },
      business: {
        title: "Firemní portréty",
        desc: "Headshoty pro celý tým přímo u vás ve firmě. Jednotný styl, rychlé dodání a licence pro web, sociální sítě i média.",
        packages: [
          { name: "Solo", price: "3 900 Kč", duration: "do 1 hod", includes: ["1–3 osoby", "2 upravené fotky na osobu", "focení u vás nebo venku", "online galerie s výběrem"] },
          { name: "Tým", price: "950 Kč / osoba", duration: "10–15 min na osobu", includes: ["4–15 osob, minimálně 4 900 Kč", "mobilní ateliér u vás ve firmě", "2 upravené fotky na osobu", "online galerie s výběrem"] },
          { name: "Velký tým", price: "790 Kč / osoba", duration: "10–15 min na osobu", includes: ["16 a více osob", "mobilní ateliér u vás ve firmě", "2 upravené fotky na osobu", "online galerie s výběrem"] },
          { name: "Firma v akci", price: "od 6 500 Kč", duration: "3 hod", includes: ["lidé při práci, prostory, detaily", "cca 30 upravených fotek", "pro web, kariérní stránky a výroční zprávy"] },
        ],
        extras: [
          { name: "Fotka navíc", price: "350 Kč", duration: "", includes: [] },
          { name: "Rozšířená licence (reklama, billboardy, podlicence)", price: "+30 %, min. 2 000 Kč", duration: "", includes: [] },
          { name: "Doprava mimo Prahu", price: "8 Kč/km", duration: "", includes: [] },
          { name: "Dofocení chybějících jiný den", price: "1 500 Kč + cena za osobu", duration: "", includes: [] },
        ],
        note: "Doprava po Praze v ceně.",
      },
    },
    testimonials: [],
  },
  en: {
    home: {
      title: "Guth Pictures",
      subtitle: "Portraits, weddings and larps. Prague and beyond.",
    },
    "o-mne": {
      title: "About",
      subtitle: "I'm a photographer based in Prague.",
      bio: "I shoot portraits, weddings and larps. I like capturing things as they actually happened, without over-posing. I travel across the Czech Republic but my home base is Prague.",
    },
    lightTesterPromo: {
      title: "Try the lights before the shoot",
      desc: "Interactive 3D studio lighting simulator. Set up your lighting scheme, explore presets and come prepared.",
    },
    sluzby: {
      portraits: {
        title: "Portraits",
        desc: "Individual and group portraits. In the studio, outdoors or at your place. Natural expression comes first.",
        packages: [
          { name: "Basic", price: "2 500 CZK", duration: "1.5 hrs", includes: ["7 edited photos", "online gallery"] },
          { name: "Extended", price: "4 000 CZK", duration: "2–4 hrs", includes: ["15 edited photos", "online gallery"] },
        ],
        note: "Travel outside Prague billed separately.",
      },
      weddings: {
        title: "Weddings",
        desc: "Full day coverage from preparations to the evening. I shoot documentary style, without forced poses.",
        packages: [
          { name: "Basic", price: "8 000 CZK", duration: "4 hrs", includes: ["~150 photos", "online gallery", "ceremony or part of day"] },
          { name: "Full day", price: "15 000 CZK", duration: "8–10 hrs", includes: ["300+ photos", "preparations to evening", "online gallery"] },
        ],
        note: "30% deposit available when booking.",
      },
      business: {
        title: "Business portraits",
        desc: "Headshots for your whole team, shot on site at your office. Consistent style, fast delivery and a licence for web, social media and press.",
        packages: [
          { name: "Solo", price: "3 900 CZK", duration: "up to 1 hr", includes: ["1–3 people", "2 edited photos per person", "at your office or outdoors", "online gallery to pick from"] },
          { name: "Team", price: "950 CZK / person", duration: "10–15 min per person", includes: ["4–15 people, minimum 4 900 CZK", "mobile studio at your office", "2 edited photos per person", "online gallery to pick from"] },
          { name: "Large team", price: "790 CZK / person", duration: "10–15 min per person", includes: ["16+ people", "mobile studio at your office", "2 edited photos per person", "online gallery to pick from"] },
          { name: "Company at work", price: "from 6 500 CZK", duration: "3 hrs", includes: ["people at work, spaces, details", "~30 edited photos", "for websites, career pages and annual reports"] },
        ],
        extras: [
          { name: "Extra photo", price: "350 CZK", duration: "", includes: [] },
          { name: "Extended licence (advertising, billboards, sublicensing)", price: "+30 %, min. 2 000 CZK", duration: "", includes: [] },
          { name: "Travel outside Prague", price: "8 CZK/km", duration: "", includes: [] },
          { name: "Make-up session for absentees", price: "1 500 CZK + per-person price", duration: "", includes: [] },
        ],
        note: "Travel within Prague included.",
      },
    },
    testimonials: [],
  },
};

const withIds = (pkgs: PricingPackage[]): PricingPackage[] =>
  pkgs.map((pkg) => ({ ...pkg, id: pkg.id ?? crypto.randomUUID() }));

export function normalizeContent(data: ContentData, locale = "cs"): ContentData {
  const normalizeService = (svc: ServiceContent): ServiceContent => ({
    ...svc,
    packages: withIds(svc.packages ?? []),
    ...(svc.extras && { extras: withIds(svc.extras) }),
  });
  // KV data saved before the business page existed has no business service
  const business = data.sluzby.business ?? (defaults[locale] ?? defaults.cs).sluzby.business;
  return {
    ...data,
    lightTesterPromo: data.lightTesterPromo ?? { title: "", desc: "" },
    sluzby: {
      portraits: normalizeService(data.sluzby.portraits),
      weddings: normalizeService(data.sluzby.weddings),
      business: normalizeService(business),
    },
    testimonials: (data.testimonials ?? []).map((t) => ({
      ...t,
      id: t.id ?? crypto.randomUUID(),
    })),
  };
}

export async function getContent(locale: string): Promise<ContentData> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<ContentData>(`content:${locale}`);
      if (data) return normalizeContent(data, locale);
    } catch {
      // KV unavailable, fall through to defaults
    }
  }
  return normalizeContent(defaults[locale] ?? defaults.cs, locale);
}

export async function setContent(locale: string, data: ContentData): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(`content:${locale}`, data);
}

export async function getImages(): Promise<SiteImages> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<SiteImages>("content:images");
      if (data) return data;
    } catch {
      // KV unavailable, fall through to defaults
    }
  }
  return { profile: "" };
}

export async function setImages(data: SiteImages): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set("content:images", data);
}

export async function getContactEmail(): Promise<string> {
  const kv = await getKv();
  if (kv) {
    try {
      const email = await kv.get<string>("content:email");
      if (email) return email;
    } catch {
      // KV unavailable, fall through to env
    }
  }
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "guth.jarkovsky.tomas@gmail.com";
}

export async function setContactEmail(email: string): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set("content:email", email);
}
