import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft, StoryTextEntry, StoryTemplate } from "./types";

const PHOTOS_PER_STORY = 3;

export type ComposedDraft = Omit<StoryDraft, "id" | "createdAt">;

/**
 * Deterministické složení návrhů: fotky se berou round-robin napříč kategoriemi
 * (v pořadí vstupu = nejnovější první z Cloudinary), šablony se střídají C/D,
 * texty rotují ze schváleného zásobníku. Když nestačí fotky, batch se zmenší.
 */
export function composeDrafts(opts: {
  photos: GalleryPhoto[];
  usedIds: Set<string>;
  texts: StoryTextEntry[];
  count: number;
}): { drafts: ComposedDraft[]; usedNow: string[] } {
  const available = opts.photos.filter(p => !opts.usedIds.has(p.publicId));

  // round-robin přes kategorie, ať jeden batch nemá jen svatby
  const byCategory = new Map<string, GalleryPhoto[]>();
  for (const p of available) {
    const arr = byCategory.get(p.category) ?? [];
    arr.push(p);
    byCategory.set(p.category, arr);
  }
  const pool: GalleryPhoto[] = [];
  const buckets = [...byCategory.values()];
  const maxLen = buckets.length ? Math.max(...buckets.map(b => b.length)) : 0;
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) if (bucket[i]) pool.push(bucket[i]);
  }

  const cTexts = opts.texts.filter(t => t.approved && t.template === "C");
  const dTexts = opts.texts.filter(t => t.approved && t.template === "D");

  const drafts: ComposedDraft[] = [];
  const usedNow: string[] = [];
  let cursor = 0;

  for (let i = 0; i < opts.count; i++) {
    if (cursor + PHOTOS_PER_STORY > pool.length) break;
    const template: StoryTemplate = i % 2 === 0 ? "C" : "D";
    const slice = pool.slice(cursor, cursor + PHOTOS_PER_STORY);
    cursor += PHOTOS_PER_STORY;
    usedNow.push(...slice.map(p => p.publicId));

    const c = cTexts.length ? cTexts[Math.floor(i / 2) % cTexts.length] : undefined;
    const d = dTexts.length ? dTexts[Math.floor(i / 2) % dTexts.length] : undefined;

    drafts.push({
      template,
      photos: slice.map(p => ({ publicId: p.publicId, x: 50, y: 50 })),
      headline: c?.headline ?? "",
      sub: c?.sub ?? "",
      words: d?.words ?? [],
      subHeadline: d?.subHeadline ?? "",
      textSource: (template === "C" ? c?.source : d?.source) ?? "manual",
    });
  }

  return { drafts, usedNow };
}
