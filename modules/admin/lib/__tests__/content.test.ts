import { describe, it, expect } from "vitest";
import { normalizeContent, type ContentData } from "@/modules/admin/lib/content";

function baseContent(): ContentData {
  return {
    home: { title: "", subtitle: "" },
    "o-mne": { title: "", subtitle: "", bio: "" },
    lightTesterPromo: { title: "", desc: "" },
    sluzby: {
      portraits: { title: "", desc: "", packages: [] },
      weddings: { title: "", desc: "", packages: [] },
    },
    testimonials: [],
  };
}

describe("normalizeContent — testimonials", () => {
  it("defaults missing testimonials to an empty array", () => {
    const input = baseContent();
    // @ts-expect-error simulate legacy KV data without the field
    delete input.testimonials;
    const out = normalizeContent(input);
    expect(out.testimonials).toEqual([]);
  });

  it("backfills a missing id on a testimonial", () => {
    const input = baseContent();
    // @ts-expect-error simulate legacy row without id
    input.testimonials = [{ quote: "Skvělé focení", author: "Jana" }];
    const out = normalizeContent(input);
    expect(out.testimonials[0].id).toMatch(/[0-9a-f-]{36}/);
    expect(out.testimonials[0].quote).toBe("Skvělé focení");
  });

  it("preserves an existing id", () => {
    const input = baseContent();
    input.testimonials = [{ id: "fixed-id", quote: "q", author: "a" }];
    const out = normalizeContent(input);
    expect(out.testimonials[0].id).toBe("fixed-id");
  });
});
