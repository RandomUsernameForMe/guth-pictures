import { upsertProposal } from "@/modules/brand-shoot/lib/proposals";
import type {
  ProposalSyncPayload,
  ProposalConcept,
  ProposalImage,
  ProposalPalette,
  ProposalStatus,
} from "@/modules/brand-shoot/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Authenticated by a shared bearer secret (the local sync script has no admin session).
function authorized(request: NextRequest): boolean {
  const secret = process.env.PROPOSAL_SYNC_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  // Constant-ish comparison; tokens are server-generated so length-leak is acceptable.
  return token.length === secret.length && token === secret;
}

const STATUSES: ProposalStatus[] = ["approved", "rejected", "pending"];
const isStatus = (v: unknown): v is ProposalStatus => STATUSES.includes(v as ProposalStatus);
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function parseConcept(v: unknown): ProposalConcept | null {
  if (!v || typeof v !== "object") return null;
  const c = v as Record<string, unknown>;
  if (!isStr(c.id) || !isStr(c.title) || !isStrArr(c.palette) || !isStrArr(c.shotList)) return null;
  return {
    id: c.id,
    title: c.title,
    pitch: isStr(c.pitch) ? c.pitch : "",
    why: isStr(c.why) ? c.why : "",
    mood: isStr(c.mood) ? c.mood : "",
    palette: c.palette,
    wardrobe: isStr(c.wardrobe) ? c.wardrobe : "",
    location: isStr(c.location) ? c.location : "",
    lighting: isStr(c.lighting) ? c.lighting : "",
    shotList: c.shotList,
    poseDirection: isStr(c.poseDirection) ? c.poseDirection : "",
    status: isStatus(c.status) ? c.status : "pending",
  };
}

function parsePalette(v: unknown): ProposalPalette | null {
  if (!v || typeof v !== "object") return null;
  const p = v as Record<string, unknown>;
  if (!isStr(p.id) || !isStrArr(p.colors) || !p.colors.length) return null;
  return {
    id: p.id,
    name: isStr(p.name) ? p.name : p.id,
    colors: p.colors,
    status: isStatus(p.status) ? p.status : "pending",
  };
}

function parseImage(v: unknown): ProposalImage | null {
  if (!v || typeof v !== "object") return null;
  const i = v as Record<string, unknown>;
  if (!isStr(i.cloudinaryId) || typeof i.width !== "number" || typeof i.height !== "number") return null;
  return {
    cloudinaryId: i.cloudinaryId,
    width: i.width,
    height: i.height,
    note: isStr(i.note) ? i.note : undefined,
    status: isStatus(i.status) ? i.status : "pending",
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isStr(raw.slug) || !isStr(raw.name)) {
    return NextResponse.json({ error: "Missing slug/name" }, { status: 400 });
  }
  const locale = raw.locale === "en" ? "en" : "cs";
  const brief = (raw.brief ?? {}) as Record<string, unknown>;

  const concepts = (Array.isArray(raw.concepts) ? raw.concepts : [])
    .map(parseConcept)
    .filter(Boolean) as ProposalConcept[];
  const palettes = (Array.isArray(raw.palettes) ? raw.palettes : [])
    .map(parsePalette)
    .filter(Boolean) as ProposalPalette[];
  const moodboard = (Array.isArray(raw.moodboard) ? raw.moodboard : [])
    .map(parseImage)
    .filter(Boolean) as ProposalImage[];
  const poses = (Array.isArray(raw.poses) ? raw.poses : [])
    .map(parseImage)
    .filter(Boolean) as ProposalImage[];

  const payload: ProposalSyncPayload = {
    slug: raw.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: raw.name,
    locale,
    brief: {
      linkedin: isStr(brief.linkedin) ? brief.linkedin : undefined,
      website: isStr(brief.website) ? brief.website : undefined,
      notes: isStr(brief.notes) ? brief.notes : undefined,
      date: isStr(brief.date) ? brief.date : new Date().toISOString().slice(0, 10),
    },
    research: isStr(raw.research) ? raw.research : "",
    concepts,
    palettes,
    moodboard,
    poses,
    coverImageId: isStr(raw.coverImageId) ? raw.coverImageId : undefined,
  };

  try {
    const record = await upsertProposal(payload);
    return NextResponse.json({ ok: true, slug: record.slug, syncedAt: record.syncedAt });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
