import "server-only";
import { getKv } from "./kv";

export type ServiceContent = {
  title: string;
  desc: string;
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
      },
      weddings: {
        title: "Svatby",
        desc: "Celý den od příprav po večer. Reportážní styl — žádné nucené pózy, jen skutečné okamžiky.",
      },
      larp: {
        title: "Larpy a akce",
        desc: "Specializuji se na fotografii z larpových akcí. Rychlé světlo, pohyb, atmosféra — to je moje parketa.",
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
      },
      weddings: {
        title: "Weddings",
        desc: "Full day coverage from preparations to the evening. Documentary style — no forced poses, just real moments.",
      },
      larp: {
        title: "Larps & events",
        desc: "I specialise in larp event photography. Fast light, movement, atmosphere — that's my playground.",
      },
    },
  },
};

export async function getContent(locale: string): Promise<ContentData> {
  const kv = await getKv();
  if (kv) {
    try {
      const data = await kv.get<ContentData>(`content:${locale}`);
      if (data) return data;
    } catch {
      // KV unavailable, fall through to defaults
    }
  }
  return defaults[locale] ?? defaults.cs;
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
