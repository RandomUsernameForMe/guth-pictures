// Client-safe shared types for the brand-shoot (proposals) module.
// No server-only imports here so both components and server libs can use them.

export type ProposalStatus = "approved" | "rejected" | "pending";

export type ProposalLocale = "cs" | "en";

export interface ProposalConcept {
  id: string; // "A" | "B" | "C" — stable per proposal
  title: string;
  pitch: string;
  why: string;
  mood: string;
  palette: string[]; // hex strings
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
  status: ProposalStatus;
}

// Proposal-level color palette option. Approved palettes drive the client-page
// theme + the palette toggle (see palette-theme.ts).
export interface ProposalPalette {
  id: string; // stable slug, e.g. "nokturno"
  name: string;
  colors: string[]; // 4–6 hex
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
  research: string; // markdown
  concepts: ProposalConcept[];
  palettes: ProposalPalette[];
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
  concepts: ProposalConcept[];
  palettes: ProposalPalette[];
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
  concepts: ProposalConcept[];
  palettes: ProposalPalette[];
  moodboard: ProposalImage[];
  poses: ProposalImage[];
  coverImageId?: string;
}
