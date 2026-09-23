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

  it("rejects a quote over the length limit", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", quote: "x".repeat(2001), author: "Jana" }];
    expect(isValidContentData(d)).toBe(false);
  });

  it("rejects an empty author", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "1", quote: "ok", author: "" }];
    expect(isValidContentData(d)).toBe(false);
  });

  it("rejects an oversized id", () => {
    const d = valid() as Record<string, unknown>;
    d.testimonials = [{ id: "x".repeat(201), quote: "ok", author: "Jana" }];
    expect(isValidContentData(d)).toBe(false);
  });
});

describe("isValidContentData — business service", () => {
  const extra = { name: "Fotka navíc", price: "350 Kč", duration: "", includes: [] };

  it("accepts data without business service (legacy)", () => {
    expect(isValidContentData(valid())).toBe(true);
  });

  it("accepts business service with extras", () => {
    const d = valid() as { sluzby: Record<string, unknown> };
    d.sluzby.business = { title: "t", desc: "d", packages: [], extras: [extra] };
    expect(isValidContentData(d)).toBe(true);
  });

  it("rejects business service with malformed extras", () => {
    const d = valid() as { sluzby: Record<string, unknown> };
    d.sluzby.business = { title: "t", desc: "d", packages: [], extras: [{ name: 1 }] };
    expect(isValidContentData(d)).toBe(false);
  });

  it("rejects business service that is not an object", () => {
    const d = valid() as { sluzby: Record<string, unknown> };
    d.sluzby.business = "nope";
    expect(isValidContentData(d)).toBe(false);
  });
});
