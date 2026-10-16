import "server-only";
import { hash, compare } from "bcryptjs";
import { getKv } from "@/lib/kv";

export interface GalleryRecord {
  slug: string;
  albumId: string;
  catalogId: string;
  passwordHash: string;
  expiryDays: number;
  expiresAt: string; // ISO
  createdAt: string; // ISO
  syncedAt?: string; // ISO
  photoCount: number;
  maxSelection?: number;
  delivered?: boolean;
}

export interface GalleryPhoto {
  lrId: string;
  cloudinaryId: string;
  filename: string;
  width: number;
  height: number;
}

export interface GallerySelection {
  favorites: string[]; // lrIds
  note?: string;
  submittedAt?: string;
  confirmedAt?: string;
  lastUpdated: string;
}

export interface GallerySelectionSummary {
  count: number;
  lastUpdated: string;
  confirmedAt?: string;
}

export type GalleryListItem = GalleryRecord & { selection: GallerySelectionSummary | null };

function key(slug: string) {
  return `gallery:${slug}`;
}

export async function listGalleries(): Promise<GalleryRecord[]> {
  const kv = await getKv();
  if (!kv) return [];
  const slugs = await kv.smembers("galleries:index") as string[];
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((s) => kv.get<GalleryRecord>(key(s))));
  return records.filter(Boolean) as GalleryRecord[];
}

export async function getGallery(slug: string): Promise<GalleryRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<GalleryRecord>(key(slug));
}

export async function createGallery(params: {
  slug: string;
  albumId: string;
  catalogId: string;
  password: string;
  expiryDays: number;
  maxSelection?: number;
}): Promise<GalleryRecord> {
  const kv = await getKv();
  if (!kv) throw new Error("KV unavailable");

  const existing = await kv.get(key(params.slug));
  if (existing) throw new Error(`Gallery "${params.slug}" already exists`);

  const passwordHash = await hash(params.password, 12);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + params.expiryDays * 86400_000).toISOString();

  const record: GalleryRecord = {
    slug: params.slug,
    albumId: params.albumId,
    catalogId: params.catalogId,
    passwordHash,
    expiryDays: params.expiryDays,
    expiresAt,
    createdAt: now.toISOString(),
    photoCount: 0,
    ...(params.maxSelection !== undefined && { maxSelection: params.maxSelection }),
  };

  await kv.set(key(params.slug), record);
  await kv.sadd("galleries:index", params.slug);
  return record;
}

export async function updateGallerySyncState(
  slug: string,
  photoCount: number
): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const record = await kv.get<GalleryRecord>(key(slug));
  if (!record) return;
  await kv.set(key(slug), {
    ...record,
    photoCount,
    syncedAt: new Date().toISOString(),
  });
}

export async function setGalleryDelivered(slug: string, delivered: boolean): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const record = await kv.get<GalleryRecord>(key(slug));
  if (!record) return;
  await kv.set(key(slug), { ...record, delivered });
}

export async function deleteGallery(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await Promise.all([
    kv.del(key(slug)),
    kv.del(`${key(slug)}:photos`),
    kv.del(`${key(slug)}:selection`),
    kv.srem("galleries:index", slug),
  ]);
}

export async function setGalleryPhotos(slug: string, photos: GalleryPhoto[]): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await kv.set(`${key(slug)}:photos`, photos);
}

export async function getGalleryPhotos(slug: string): Promise<GalleryPhoto[]> {
  const kv = await getKv();
  if (!kv) return [];
  return (await kv.get<GalleryPhoto[]>(`${key(slug)}:photos`)) ?? [];
}

export async function getGallerySelection(slug: string): Promise<GallerySelection | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<GallerySelection>(`${key(slug)}:selection`);
}

export async function saveGallerySelection(
  slug: string,
  favorites: string[],
  note?: string
): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const existing = await kv.get<GallerySelection>(`${key(slug)}:selection`);
  const now = new Date().toISOString();
  // undefined = keep existing note, "" = clear it
  const nextNote = note === undefined ? existing?.note : note || undefined;
  await kv.set(`${key(slug)}:selection`, {
    favorites,
    ...(nextNote ? { note: nextNote } : {}),
    submittedAt: existing?.submittedAt ?? now,
    ...(existing?.confirmedAt ? { confirmedAt: existing.confirmedAt } : {}),
    lastUpdated: now,
  } satisfies GallerySelection);
}

export async function pruneGallerySelection(slug: string, validIds: Set<string>): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const existing = await kv.get<GallerySelection>(`${key(slug)}:selection`);
  if (!existing) return;
  const favorites = existing.favorites.filter((id) => validIds.has(id));
  if (favorites.length === existing.favorites.length) return;
  await kv.set(`${key(slug)}:selection`, { ...existing, favorites } satisfies GallerySelection);
}

export async function confirmGallerySelection(slug: string): Promise<string | null> {
  const kv = await getKv();
  if (!kv) return null;
  const existing = await kv.get<GallerySelection>(`${key(slug)}:selection`);
  if (!existing || existing.favorites.length === 0) return null;
  const confirmedAt = existing.confirmedAt ?? new Date().toISOString();
  await kv.set(`${key(slug)}:selection`, { ...existing, confirmedAt } satisfies GallerySelection);
  return confirmedAt;
}

export async function unlockGallerySelection(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  const existing = await kv.get<GallerySelection>(`${key(slug)}:selection`);
  if (!existing?.confirmedAt) return;
  const { confirmedAt: _confirmedAt, ...rest } = existing;
  await kv.set(`${key(slug)}:selection`, rest satisfies GallerySelection);
}

export async function verifyGalleryPassword(
  slug: string,
  password: string
): Promise<boolean> {
  const record = await getGallery(slug);
  if (!record) return false;
  return compare(password, record.passwordHash);
}

export function isExpired(gallery: GalleryRecord): boolean {
  return new Date() > new Date(gallery.expiresAt);
}

export async function listGalleriesWithSelection(): Promise<GalleryListItem[]> {
  const galleries = await listGalleries();
  return Promise.all(
    galleries.map(async (g) => {
      const sel = await getGallerySelection(g.slug);
      const selection =
        sel && sel.favorites.length > 0
          ? {
              count: sel.favorites.length,
              lastUpdated: sel.lastUpdated,
              ...(sel.confirmedAt ? { confirmedAt: sel.confirmedAt } : {}),
            }
          : null;
      return { ...g, selection };
    })
  );
}
