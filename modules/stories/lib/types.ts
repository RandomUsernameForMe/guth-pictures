export type StoryTemplate = "C" | "D";

export type StoryTextEntry = {
  id: string;
  template: StoryTemplate;
  headline?: string;    // C
  sub?: string;         // C
  words?: string[];     // D
  subHeadline?: string; // D
  source: "manual" | "ai";
  approved: boolean;
};

export type DraftPhoto = { publicId: string; x: number; y: number };

export type StoryDraft = {
  id: string;
  template: StoryTemplate;
  photos: DraftPhoto[];
  headline: string;
  sub: string;
  words: string[];
  subHeadline: string;
  textSource: "manual" | "ai";
  createdAt: string; // ISO
};

export type QueueItem = {
  id: string;
  template: StoryTemplate;
  videoPublicId: string;
  publishAt: string; // ISO
  status: "queued" | "published" | "failed";
  error?: string;
};

export type UsedPhoto = { publicId: string; usedAt: string };
