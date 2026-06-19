import "server-only";
import { hash, compare } from "bcryptjs";
import { getKv } from "@/lib/kv";
import type {
  ProposalRecord,
  ProposalSyncPayload,
  ProposalStatus,
  ProposalPublic,
  ProposalImage,
} from "./types";

export type {
  ProposalRecord,
  ProposalSyncPayload,
  ProposalStatus,
  ProposalPublic,
} from "./types";

function key(slug: string) {
  return `proposal:${slug}`;
}

// Back-compat: records synced before palettes moved under concepts lack `concept.palettes`
// (they had a brand-level `palettes[]` + a single `concept.palette`). Guarantee every concept
// carries a palettes array so all consumers (admin reads the raw record) can't hit undefined.
function normalize(record: ProposalRecord | null): ProposalRecord | null {
  if (!record) return null;
  return {
    ...record,
    concepts: record.concepts.map((c) => ({ ...c, palettes: c.palettes ?? [] })),
  };
}

export async function listProposals(): Promise<ProposalRecord[]> {
  const kv = await getKv();
  if (!kv) return [];
  const slugs = (await kv.smembers("proposals:index")) as string[];
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((s) => kv.get<ProposalRecord>(key(s))));
  return (records.filter(Boolean) as ProposalRecord[])
    .map((r) => normalize(r) as ProposalRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProposal(slug: string): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  return normalize(await kv.get<ProposalRecord>(key(slug)));
}

// Ingest from the local sync script. Content (brief/research/concepts/images) comes
// from the payload; web-managed state (password, finalized flag, and per-item approval
// status set in the admin) is preserved across re-syncs. New items default to their
// incoming status; items dropped upstream disappear.
export async function upsertProposal(payload: ProposalSyncPayload): Promise<ProposalRecord> {
  const kv = await getKv();
  if (!kv) throw new Error("KV unavailable");

  const existing = await kv.get<ProposalRecord>(key(payload.slug));
  const now = new Date().toISOString();

  const conceptStatus = new Map(existing?.concepts.map((c) => [c.id, c.status]));
  // Admin-picked palette per concept survives re-syncs (web-managed, like status).
  const chosenPalette = new Map(
    existing?.concepts.map((c) => [c.id, c.chosenPaletteId]).filter(([, v]) => v) as [string, string][]
  );
  // Palettes now live under concepts; flatten existing ones to preserve their approval state by id.
  const paletteStatus = new Map(
    existing?.concepts.flatMap((c) => (c.palettes ?? []).map((p) => [p.id, p.status] as const))
  );
  // Image→concept assignment, hero flag + approval status are web-managed; preserve across re-syncs.
  const moodAssign = new Map(existing?.moodboard.map((i) => [i.cloudinaryId, i]));
  const poseAssign = new Map(existing?.poses.map((i) => [i.cloudinaryId, i]));

  const record: ProposalRecord = {
    slug: payload.slug,
    name: payload.name,
    locale: payload.locale,
    brief: payload.brief,
    research: payload.research,
    summary: payload.summary,
    intro: payload.intro,
    concepts: payload.concepts.map((c) => {
      const palettes = (c.palettes ?? []).map((p) => ({
        ...p,
        status: paletteStatus.get(p.id) ?? p.status,
      }));
      const chosen =
        chosenPalette.get(c.id) ??
        c.chosenPaletteId ??
        palettes.find((p) => p.status === "approved")?.id;
      return {
        ...c,
        status: conceptStatus.get(c.id) ?? c.status,
        palettes,
        chosenPaletteId: palettes.some((p) => p.id === chosen) ? chosen : undefined,
      };
    }),
    moodboard: payload.moodboard.map((i) => {
      const prev = moodAssign.get(i.cloudinaryId);
      return {
        ...i,
        concept: prev?.concept ?? i.concept,
        hero: prev?.hero ?? i.hero,
        status: prev?.status ?? i.status,
      };
    }),
    poses: payload.poses.map((i) => {
      const prev = poseAssign.get(i.cloudinaryId);
      return {
        ...i,
        concept: prev?.concept ?? i.concept,
        hero: prev?.hero ?? i.hero,
        status: prev?.status ?? i.status,
      };
    }),
    coverImageId: payload.coverImageId,
    finalized: existing?.finalized ?? false,
    finalizedAt: existing?.finalizedAt,
    passwordHash: existing?.passwordHash,
    expiresAt: existing?.expiresAt,
    createdAt: existing?.createdAt ?? now,
    syncedAt: now,
  };

  await kv.set(key(payload.slug), record);
  await kv.sadd("proposals:index", payload.slug);
  return record;
}

export interface ApprovalPatch {
  concepts?: Record<string, ProposalStatus>;
  palettes?: Record<string, ProposalStatus>;
  moodboard?: Record<string, ProposalStatus>;
  poses?: Record<string, ProposalStatus>;
}

export async function setApprovals(slug: string, patch: ApprovalPatch): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return null;

  const apply = <T extends { status: ProposalStatus }>(
    items: T[],
    keyOf: (item: T) => string,
    map?: Record<string, ProposalStatus>
  ) => (map ? items.map((it) => (map[keyOf(it)] ? { ...it, status: map[keyOf(it)] } : it)) : items);

  const updated: ProposalRecord = {
    ...record,
    concepts: apply(record.concepts, (c) => c.id, patch.concepts).map((c) => ({
      ...c,
      palettes: apply(c.palettes ?? [], (p) => p.id, patch.palettes),
    })),
    moodboard: apply(record.moodboard, (i) => i.cloudinaryId, patch.moodboard),
    poses: apply(record.poses, (i) => i.cloudinaryId, patch.poses),
  };
  await kv.set(key(slug), updated);
  return updated;
}

type ImageAssign = { concept?: string | null; hero?: boolean };

export interface AssignmentPatch {
  images?: {
    moodboard?: Record<string, ImageAssign>; // cloudinaryId -> assignment
    poses?: Record<string, ImageAssign>;
  };
  chosenPalette?: Record<string, string>; // conceptId -> paletteId
}

// Web-admin assignment writes: which concept each image belongs to (+ hero), and the one
// palette chosen per concept. Persisted on the record (and preserved across re-syncs by upsert).
export async function setAssignments(slug: string, patch: AssignmentPatch): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return null;

  const applyImages = (items: ProposalImage[], map?: Record<string, ImageAssign>): ProposalImage[] => {
    if (!map) return items;
    // First lay down the per-image edits.
    let next = items.map((i) => {
      const a = map[i.cloudinaryId];
      if (!a) return i;
      const concept = a.concept === null ? undefined : a.concept ?? i.concept;
      const hero = a.hero ?? i.hero;
      return { ...i, concept, hero };
    });
    // Enforce a single hero per concept for any concept touched by a hero:true edit.
    const heroedConcepts = new Set(
      Object.entries(map)
        .filter(([, a]) => a.hero === true)
        .map(([cid]) => next.find((i) => i.cloudinaryId === cid)?.concept)
        .filter(Boolean) as string[]
    );
    if (heroedConcepts.size) {
      next = next.map((i) =>
        i.hero && i.concept && heroedConcepts.has(i.concept) && !map[i.cloudinaryId]?.hero
          ? { ...i, hero: false }
          : i
      );
    }
    return next;
  };

  const chosen = patch.chosenPalette;
  const updated: ProposalRecord = {
    ...record,
    concepts: record.concepts.map((c) =>
      chosen && chosen[c.id] !== undefined ? { ...c, chosenPaletteId: chosen[c.id] || undefined } : c
    ),
    moodboard: applyImages(record.moodboard, patch.images?.moodboard),
    poses: applyImages(record.poses, patch.images?.poses),
  };
  await kv.set(key(slug), updated);
  return updated;
}

export async function setFinalized(slug: string, finalized: boolean): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return null;
  const updated: ProposalRecord = {
    ...record,
    finalized,
    finalizedAt: finalized ? new Date().toISOString() : undefined,
  };
  await kv.set(key(slug), updated);
  return updated;
}

export async function setPassword(
  slug: string,
  password: string,
  expiryDays?: number
): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  const record = await kv.get<ProposalRecord>(key(slug));
  if (!record) return null;
  const updated: ProposalRecord = {
    ...record,
    passwordHash: await hash(password, 12),
    expiresAt:
      expiryDays && expiryDays > 0
        ? new Date(Date.now() + expiryDays * 86400_000).toISOString()
        : undefined,
  };
  await kv.set(key(slug), updated);
  return updated;
}

export async function verifyProposalPassword(slug: string, password: string): Promise<boolean> {
  const record = await getProposal(slug);
  if (!record || !record.passwordHash) return false;
  return compare(password, record.passwordHash);
}

export function isExpired(record: ProposalRecord): boolean {
  return record.expiresAt ? new Date() > new Date(record.expiresAt) : false;
}

export async function deleteProposal(slug: string): Promise<void> {
  const kv = await getKv();
  if (!kv) return;
  await Promise.all([kv.del(key(slug)), kv.srem("proposals:index", slug)]);
}

// Strip to approved-only, drop internal fields — for the gated client view.
export function toPublicProposal(record: ProposalRecord): ProposalPublic {
  const approved = <T extends { status: ProposalStatus }>(items: T[]) =>
    items.filter((i) => i.status === "approved");
  return {
    slug: record.slug,
    name: record.name,
    locale: record.locale,
    summary: record.summary,
    intro: record.intro,
    // Approved concepts only; ship just the one admin-chosen palette (fallback: first approved).
    concepts: approved(record.concepts).map((c) => {
      const pals = approved(c.palettes ?? []);
      const chosen = pals.find((p) => p.id === c.chosenPaletteId) ?? pals[0];
      return {
        ...c,
        palettes: chosen ? [chosen] : [],
        chosenPaletteId: chosen?.id,
      };
    }),
    moodboard: approved(record.moodboard),
    poses: approved(record.poses),
    coverImageId: record.coverImageId,
  };
}
