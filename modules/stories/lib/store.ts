import "server-only";
import { getKv } from "@/lib/kv";
import type { StoryDraft, StoryTextEntry, QueueItem, UsedPhoto } from "./types";

const KEYS = {
  texts: "stories:texts",
  drafts: "stories:drafts",
  queue: "stories:queue",
  used: "stories:usedPhotos",
} as const;

const USED_WEEKS = 8;

// read vrací [] i bez nakonfigurovaného KV (lokální dev — UI se načte prázdné);
// write v tom případě hází, takže cron bez KV selže nahlas.
async function read<T>(key: string): Promise<T[]> {
  const kv = await getKv();
  if (!kv) return [];
  return (await kv.get<T[]>(key)) ?? [];
}

async function write<T>(key: string, value: T[]): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  await kv.set(key, value);
}

export const getTexts = () => read<StoryTextEntry>(KEYS.texts);
export const saveTexts = (v: StoryTextEntry[]) => write(KEYS.texts, v);
export const getDrafts = () => read<StoryDraft>(KEYS.drafts);
export const saveDrafts = (v: StoryDraft[]) => write(KEYS.drafts, v);
export const getQueue = () => read<QueueItem>(KEYS.queue);
export const saveQueue = (v: QueueItem[]) => write(KEYS.queue, v);

/** Nové AI texty před existující; schválené a manuální zůstanou, neschválených AI jen nejnovějších maxPending. */
export function mergeAiTexts(
  aiTexts: StoryTextEntry[],
  existing: StoryTextEntry[],
  maxPending = 10,
): StoryTextEntry[] {
  let pending = 0;
  return [...aiTexts, ...existing].filter(t => {
    if (t.approved || t.source !== "ai") return true;
    return ++pending <= maxPending;
  });
}

export async function markPhotosUsed(publicIds: string[], now = new Date()): Promise<void> {
  const used = await read<UsedPhoto>(KEYS.used);
  const usedAt = now.toISOString();
  const merged = [
    ...used.filter(u => !publicIds.includes(u.publicId)),
    ...publicIds.map(publicId => ({ publicId, usedAt })),
  ];
  await write(KEYS.used, merged);
}

/** publicIds fotek použitých v posledních 8 týdnech */
export async function getUsedPhotoIds(now = new Date()): Promise<Set<string>> {
  const cutoff = new Date(now.getTime() - USED_WEEKS * 7 * 24 * 3600 * 1000);
  const used = await read<UsedPhoto>(KEYS.used);
  return new Set(used.filter(u => new Date(u.usedAt) >= cutoff).map(u => u.publicId));
}
