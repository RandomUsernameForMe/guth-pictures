import "server-only";
import { getKv } from "./kv";
import type { PricingPackage } from "./types";

export type { PricingPackage };

export type ServiceContent = {
  title: string;
  desc: string;
  packages: PricingPackage[];
  note?: string;
};

export type ContentData = {
  home: { title: string; subtitle: string };
  "o-mne": { title: string; subtitle: string; bio: string };
  sluzby: {
    portraits: ServiceContent;
    weddings: ServiceContent;
    larp: ServiceContent;
  };
};

export type SiteImages = {
  hero: string;    // Cloudinary public ID
  profile: string; // Cloudinary public ID
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
      bio: "Fotím portréty, svatby a larpy. Baví mě zachytit věci tak, jak se opravdu staly — bez přehnaného hraní před objektivem. Cestuji po celé ČR, ale mám základnu v Praze.",
    },
    sluzby: {
      portraits: {
        title: "Portréty",
        desc: "Individuální i skupinové portréty. V ateliéru, v přírodě nebo ve vašem prostředí — důraz na přirozenost a výraz.",
        packages: [
          { name: "Základ", price: "2 500 Kč", duration: "1,5 hod", includes: ["7 upravených fotek", "online galerie"] },
          { name: "Rozšířený", price: "4 000 Kč", duration: "2–4 hod", includes: ["15 upravených fotek", "online galerie"] },
        ],
        note: "Ceny bez dopravy mimo Prahu.",
      },
      weddings: {
        title: "Svatby",
        desc: "Celý den od příprav po večer. Reportážní styl — žádné nucené pózy, jen skutečné okamžiky.",
        packages: [
          { name: "Základ", price: "8 000 Kč", duration: "4 hod", includes: ["cca 150 fotek", "online galerie", "jeden obřad / část dne"] },
          { name: "Celý den", price: "15 000 Kč", duration: "8–10 hod", includes: ["300+ fotek", "přípravy až po večer", "online galerie"] },
        ],
        note: "Možná záloha 30 % při rezervaci termínu.",
      },
      larp: {
        title: "Larpy a akce",
        desc: "Specializuji se na fotografii z larpových akcí. Rychlé světlo, pohyb, atmosféra — to je moje parketa.",
        packages: [
          { name: "Akce", price: "dohodou", duration: "dle délky akce", includes: ["100+ fotek za den hry", "dodání do měsíce"] },
        ],
        note: "Ceny bez dopravy. Doprava nad 50 km od Prahy dohodou.",
      },
    },
  },
  en: {
    home: {
      title: "Guth Pictures",
      subtitle: "Portraits, weddings and larps. Prague and beyond.",
    },
    "o-mne": {
      title: "About",
      subtitle: "I'm a photographer based in Prague.",
      bio: "I shoot portraits, weddings and larps. I like capturing things as they actually happened — no over-posing. I travel across the Czech Republic but my home base is Prague.",
    },
    sluzby: {
      portraits: {
        title: "Portraits",
        desc: "Individual and group portraits. Studio, outdoors or in your own environment — focused on natural expression.",
        packages: [
          { name: "Basic", price: "2 500 CZK", duration: "1.5 hrs", includes: ["7 edited photos", "online gallery"] },
          { name: "Extended", price: "4 000 CZK", duration: "2–4 hrs", includes: ["15 edited photos", "online gallery"] },
        ],
        note: "Travel outside Prague billed separately.",
      },
      weddings: {
        title: "Weddings",
        desc: "Full day coverage from preparations to the evening. Documentary style — no forced poses, just real moments.",
        packages: [
          { name: "Basic", price: "8 000 CZK", duration: "4 hrs", includes: ["~150 photos", "online gallery", "ceremony or part of day"] },
          { name: "Full day", price: "15 000 CZK", duration: "8–10 hrs", includes: ["300+ photos", "preparations to evening", "online gallery"] },
        ],
        note: "30% deposit available when booking.",
      },
      larp: {
        title: "Larps & events",
        desc: "I specialise in larp event photography. Fast light, movement, atmosphere — that's my playground.",
        packages: [
          { name: "Event", price: "by arrangement", duration: "depends on event length", includes: ["100+ photos per day of play", "delivery within a month"] },
        ],
        note: "Travel not included. Travel over 50 km from Prague by arrangement.",
      },
    },
  },
};

function normalizeContent(data: ContentData): ContentData {
  const normalizeService = (svc: ServiceContent): ServiceContent => ({
    ...svc,
    packages: (svc.packages ?? []).map((pkg) => ({
      ...pkg,
      id: pkg.id ?? crypto.randomUUID(),
    })),
  });
  return {
    ...data,
    sluzby: {
      portraits: normalizeService(data.sluzby.portraits),
      weddings: normalizeService(data.sluzby.weddings),
      larp: normalizeService(data.sluzby.larp),
    },
  };
}

export async function getContent(locale: string): Promise<ContentData> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<ContentData>(`content:${locale}`);
      if (data) return normalizeContent(data);
    } catch {
      // KV unavailable, fall through to defaults
    }
  }
  return normalizeContent(defaults[locale] ?? defaults.cs);
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
  return { hero: "", profile: "" };
}

export async function setImages(data: SiteImages): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set("content:images", data);
}
