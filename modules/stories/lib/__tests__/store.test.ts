import { describe, it, expect, vi, beforeEach } from "vitest";

const kvData = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(async (key: string) => kvData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvData.set(key, value); }),
  },
}));

import { getDrafts, saveDrafts, markPhotosUsed, getUsedPhotoIds, mergeAiTexts } from "../store";
import type { StoryDraft, StoryTextEntry } from "../types";

const draft: StoryDraft = {
  id: "d1", template: "C", photos: [{ publicId: "portfolio/a", x: 50, y: 50 }],
  headline: "H", sub: "S", words: [], subHeadline: "", textSource: "manual",
  createdAt: "2026-07-17T06:00:00.000Z",
};

beforeEach(() => {
  kvData.clear();
  process.env.KV_REST_API_URL = "https://test";
  process.env.KV_REST_API_TOKEN = "test";
});

describe("store", () => {
  it("returns empty array when nothing saved", async () => {
    expect(await getDrafts()).toEqual([]);
  });

  it("round-trips drafts", async () => {
    await saveDrafts([draft]);
    expect(await getDrafts()).toEqual([draft]);
  });

  it("markPhotosUsed upserts — no duplicate entries per publicId", async () => {
    await markPhotosUsed(["portfolio/a"], new Date("2026-05-01T00:00:00Z"));
    await markPhotosUsed(["portfolio/a"], new Date("2026-07-15T00:00:00Z"));
    const used = await getUsedPhotoIds(new Date("2026-07-17T00:00:00Z"));
    expect(used.has("portfolio/a")).toBe(true); // novější usedAt vyhrál
    expect(kvData.get("stories:usedPhotos")).toHaveLength(1);
  });

  it("markPhotosUsed accumulates and getUsedPhotoIds filters by age", async () => {
    await markPhotosUsed(["portfolio/a"], new Date("2026-05-01T00:00:00Z"));
    await markPhotosUsed(["portfolio/b"], new Date("2026-07-15T00:00:00Z"));
    // 8 týdnů zpět od 2026-07-17 => cutoff ~2026-05-22; "a" je starší, "b" novější
    const used = await getUsedPhotoIds(new Date("2026-07-17T00:00:00Z"));
    expect(used.has("portfolio/b")).toBe(true);
    expect(used.has("portfolio/a")).toBe(false);
  });
});

describe("mergeAiTexts", () => {
  const text = (id: string, source: "manual" | "ai", approved: boolean): StoryTextEntry =>
    ({ id, template: "C", headline: id, source, approved });

  it("keeps approved and manual texts, drops older pending AI texts over the limit, preserves order", () => {
    const ai = [text("n1", "ai", false), text("n2", "ai", false)];
    const existing = [
      text("p1", "ai", false),
      text("m1", "manual", false),
      text("a1", "ai", true),
      text("p2", "ai", false),
      text("p3", "ai", false),
    ];
    const result = mergeAiTexts(ai, existing, 3);
    expect(result.map(t => t.id)).toEqual(["n1", "n2", "p1", "m1", "a1"]);
  });

  it("defaults to 10 pending AI texts", () => {
    const existing = Array.from({ length: 12 }, (_, i) => text(`p${i}`, "ai", false));
    expect(mergeAiTexts([], existing)).toHaveLength(10);
  });
});
