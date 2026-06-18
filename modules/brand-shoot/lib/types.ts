// Client-safe shared types for the brand-shoot (proposals) module.
// No server-only imports here so both components and server libs can use them.

export type ProposalStatus = "approved" | "rejected" | "pending";

export type ProposalLocale = "cs" | "en";

// A color palette option belonging to an approach. Approved palettes drive the client-page
// theme via the per-concept palette toggle (see palette-theme.ts). Ids are unique across the
// whole proposal (concept-prefixed, e.g. "a-hrejiva").
export interface ProposalPalette {
  id: string; // stable slug, concept-prefixed, e.g. "a-hrejiva"
  name: string;
  colors: string[]; // 4–6 hex
  status: ProposalStatus;
}

export interface ProposalConcept {
  id: string; // "A" | "B" | "C" — stable per proposal
  title: string;
  pitch: string;
  why: string;
  mood: string;
  palettes: ProposalPalette[]; // this approach's color palette options (client-toggleable)
  wardrobe: string;
  location: string;
  lighting: string;
  shotList: string[];
  poseDirection: string;
  status: ProposalStatus;
}

export interface ProposalImage {
  cloudinaryId: string;
  width: number;
  height: number;
  note?: string;
  concept?: string; // approach this image belongs to ("A" | "B" | …); absent = unassigned/shared
  hero?: boolean; // the concept's lead/stage portrait (one per concept)
  status: ProposalStatus;
}

export interface ProposalBrief {
  linkedin?: string;
  website?: string;
  notes?: string;
  date: string;
}

export interface ProposalRecord {
  slug: string;
  name: string;
  locale: ProposalLocale;
  brief: ProposalBrief;
  research: string; // markdown — internal only
  summary?: string; // one client-facing sentence ("we understand you"), shown in the hero
  intro?: string; // client-facing "who you are" narrative (markdown-ish, blank-line paragraphs)
  concepts: ProposalConcept[]; // each carries its own palettes
  moodboard: ProposalImage[];
  poses: ProposalImage[];
  coverImageId?: string;
  finalized: boolean;
  finalizedAt?: string;
  passwordHash?: string;
  expiresAt?: string; // ISO; absent = never expires
  createdAt: string;
  syncedAt?: string;
}

// Shape the local sync script POSTs to /api/admin/proposals/sync.
// Carries content + incoming statuses; the web side merges it with any
// web-managed approval state that already exists.
export interface ProposalSyncPayload {
  slug: string;
  name: string;
  locale: ProposalLocale;
  brief: ProposalBrief;
  research: string;
  summary?: string;
  intro?: string;
  concepts: ProposalConcept[];
  moodboard: ProposalImage[];
  poses: ProposalImage[];
  coverImageId?: string;
}

// What the gated client view receives — only approved items, no internal fields.
// Research is intentionally omitted: it holds internal analysis (competitors, gaps).
export interface ProposalPublic {
  slug: string;
  name: string;
  locale: ProposalLocale;
  summary?: string;
  intro?: string;
  concepts: ProposalConcept[];
  moodboard: ProposalImage[];
  poses: ProposalImage[];
  coverImageId?: string;
}
