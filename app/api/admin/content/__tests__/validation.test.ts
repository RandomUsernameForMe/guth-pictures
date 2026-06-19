import { describe, it, expect } from "vitest";
import { isValidContentData } from "@/app/api/admin/content/route";

function valid(): unknown {
  return {
    home: { title: "t", subtitle: "s" },
    "o-mne": { title: "t", subtitle: "s", bio: "b" },
    sluzby: {
      portraits: { title: "t", desc: "d", packages: [] },
      weddings: { title: "t", desc: "d", packages: [] },
    },
    lightTesterPromo: { title: "t", desc: "d" },
    testimonials: [],
  };
}

describe("isValidContentData — testimonials", () => {
  it("accepts data with no testimonials field (legacy)", () => {
    const d = valid() as Record<string, unknown>;
    delete d.testimonials;
    expect(isValidContentData(d)).toBe(true);
  });

  it("accepts a valid testimonial", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", quote: "Skvělé", author: "Jana", role: "Svatba", photo: "site/x" }];
    expect(isValidContentData(d)).toBe(true);
  });

  it("rejects a testimonial without a quote", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", author: "Jana" }];
    expect(isValidContentData(d)).toBe(false);
  });

  it("rejects when testimonials is not an array", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = "nope";
    expect(isValidContentData(d)).toBe(false);
  });
});
