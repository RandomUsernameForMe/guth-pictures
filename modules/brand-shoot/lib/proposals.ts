import "server-only";
import { hash, compare } from "bcryptjs";
import { getKv } from "@/lib/kv";
import type {
  ProposalRecord,
  ProposalSyncPayload,
  ProposalStatus,
  ProposalPublic,
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

export async function listProposals(): Promise<ProposalRecord[]> {
  const kv = await getKv();
  if (!kv) return [];
  const slugs = (await kv.smembers("proposals:index")) as string[];
  if (!slugs.length) return [];
  const records = await Promise.all(slugs.map((s) => kv.get<ProposalRecord>(key(s))));
  return (records.filter(Boolean) as ProposalRecord[]).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function getProposal(slug: string): Promise<ProposalRecord | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<ProposalRecord>(key(slug));
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
  const paletteStatus = new Map(existing?.palettes?.map((p) => [p.id, p.status]));
  const moodStatus = new Map(existing?.moodboard.map((i) => [i.cloudinaryId, i.status]));
  const poseStatus = new Map(existing?.poses.map((i) => [i.cloudinaryId, i.status]));

  const record: ProposalRecord = {
    slug: payload.slug,
    name: payload.name,
    locale: payload.locale,
    brief: payload.brief,
    research: payload.research,
    concepts: payload.concepts.map((c) => ({
      ...c,
      status: conceptStatus.get(c.id) ?? c.status,
    })),
    palettes: (payload.palettes ?? []).map((p) => ({
      ...p,
      status: paletteStatus.get(p.id) ?? p.status,
    })),
    moodboard: payload.moodboard.map((i) => ({
      ...i,
      status: moodStatus.get(i.cloudinaryId) ?? i.status,
    })),
    poses: payload.poses.map((i) => ({
      ...i,
      status: poseStatus.get(i.cloudinaryId) ?? i.status,
    })),
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
    concepts: apply(record.concepts, (c) => c.id, patch.concepts),
    palettes: apply(record.palettes ?? [], (p) => p.id, patch.palettes),
    moodboard: apply(record.moodboard, (i) => i.cloudinaryId, patch.moodboard),
    poses: apply(record.poses, (i) => i.cloudinaryId, patch.poses),
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
    concepts: approved(record.concepts),
    palettes: approved(record.palettes ?? []),
    moodboard: approved(record.moodboard),
    poses: approved(record.poses),
    coverImageId: record.coverImageId,
  };
}
