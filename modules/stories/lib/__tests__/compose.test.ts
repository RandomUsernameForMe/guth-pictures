import { describe, it, expect } from "vitest";
import { composeDrafts } from "../compose";
import type { GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryTextEntry } from "../types";

function photo(publicId: string, category: GalleryPhoto["category"]): GalleryPhoto {
  return { publicId, width: 1000, height: 1500, alt: { cs: "", en: "" }, category };
}

const photos: GalleryPhoto[] = [
  photo("p1", "portréty"), photo("p2", "portréty"), photo("p3", "portréty"),
  photo("p4", "svatby"), photo("p5", "svatby"), photo("p6", "svatby"),
  photo("p7", "portréty"), photo("p8", "svatby"), photo("p9", "portréty"),
  photo("p10", "svatby"), photo("p11", "portréty"), photo("p12", "svatby"),
];

const texts: StoryTextEntry[] = [
  { id: "t1", template: "C", headline: "Silná\natmosféra.", sub: "Osobité portréty.", source: "manual", approved: true },
  { id: "t2", template: "D", words: ["Portréty.", "Svatby."], subHeadline: "Guth Pictures", source: "manual", approved: true },
  { id: "t3", template: "C", headline: "NESCHVÁLENO", sub: "x", source: "ai", approved: false },
];

describe("composeDrafts", () => {
  it("creates requested count, alternating templates C/D", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 4 });
    expect(drafts).toHaveLength(4);
    expect(drafts.map(d => d.template)).toEqual(["C", "D", "C", "D"]);
  });

  it("uses only unused photos and does not repeat within batch", () => {
    const { drafts, usedNow } = composeDrafts({ photos, usedIds: new Set(["p1", "p2"]), texts, count: 2 });
    const ids = drafts.flatMap(d => d.photos.map(p => p.publicId));
    expect(ids).not.toContain("p1");
    expect(ids).not.toContain("p2");
    expect(new Set(ids).size).toBe(ids.length);
    expect(usedNow).toEqual(ids);
  });

  it("only uses approved texts", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 4 });
    for (const d of drafts) expect(d.headline).not.toBe("NESCHVÁLENO");
  });

  it("shrinks batch when photos run out instead of failing", () => {
    const few = photos.slice(0, 5);
    const { drafts } = composeDrafts({ photos: few, usedIds: new Set(), texts, count: 4 });
    expect(drafts.length).toBe(1);
  });

  it("returns empty result for empty photo pool", () => {
    const { drafts, usedNow } = composeDrafts({ photos: [], usedIds: new Set(), texts, count: 4 });
    expect(drafts).toEqual([]);
    expect(usedNow).toEqual([]);
  });

  it("produces drafts with empty text fields when text pool is empty", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts: [], count: 2 });
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({ headline: "", sub: "", textSource: "manual" });
    expect(drafts[1]).toMatchObject({ words: [], subHeadline: "" });
  });

  it("photos default to centered focal point", () => {
    const { drafts } = composeDrafts({ photos, usedIds: new Set(), texts, count: 1 });
    expect(drafts[0].photos[0]).toMatchObject({ x: 50, y: 50 });
  });
});
