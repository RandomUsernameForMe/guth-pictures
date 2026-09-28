import { describe, it, expect } from "vitest";
import { normalizeContent, normalizeImages, type ContentData } from "@/modules/admin/lib/content";

function baseContent(): ContentData {
  return {
    home: { title: "", subtitle: "" },
    "o-mne": { title: "", subtitle: "", bio: "" },
    lightTesterPromo: { title: "", desc: "" },
    sluzby: {
      portraits: { title: "", desc: "", packages: [] },
      weddings: { title: "", desc: "", packages: [] },
      business: { title: "", desc: "", packages: [] },
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

describe("normalizeContent — business service", () => {
  it("fills missing business service from locale defaults (legacy KV data)", () => {
    const input = baseContent();
    // @ts-expect-error simulate legacy KV data without the field
    delete input.sluzby.business;
    const out = normalizeContent(input, "en");
    expect(out.sluzby.business.title).toBe("Business portraits");
    expect(out.sluzby.business.packages.length).toBeGreaterThan(0);
    expect(out.sluzby.business.extras?.length).toBeGreaterThan(0);
  });

  it("keeps stored business service and backfills ids on extras", () => {
    const input = baseContent();
    input.sluzby.business = {
      title: "Vlastní", desc: "d", packages: [],
      extras: [{ name: "Fotka navíc", price: "400 Kč", duration: "", includes: [] }],
    };
    const out = normalizeContent(input, "cs");
    expect(out.sluzby.business.title).toBe("Vlastní");
    expect(out.sluzby.business.extras?.[0].price).toBe("400 Kč");
    expect(out.sluzby.business.extras?.[0].id).toMatch(/[0-9a-f-]{36}/);
  });
});

describe("editorial data normalization", () => {
  it("normalizes legacy images without losing profile and triptych", () => {
    const result = normalizeImages({
      profile: "site/me",
      heroTriptych: [["a"], ["b"], ["c"]],
    });

    expect(result.profile).toBe("site/me");
    expect(result.heroTriptych).toEqual([["a"], ["b"], ["c"]]);
    expect(result.editorial.home.hero.publicId).toBe("portfolio/scppmskdespdikncpzhz");
    expect(result.editorial.business.hero.publicId).toBe("");
    expect(result.editorial.events.reportage).toHaveLength(4);
  });

  it("returns fresh editorial defaults for every image normalization", () => {
    const first = normalizeImages({ profile: "" });
    const second = normalizeImages({ profile: "" });

    first.editorial.portrait.gallery[0].publicId = "changed";

    expect(second.editorial.portrait.gallery[0].publicId).toBe("portfolio/z1tvyvvw0kg6tga3iwef");
  });

  it("adds localized editorial copy to legacy content", () => {
    const input = baseContent();
    const businessPackages = input.sluzby.business.packages;

    const cs = normalizeContent(input, "cs");
    const en = normalizeContent(baseContent(), "en");

    expect(cs.editorial.eventsTitle).toBe("Až budete u toho.");
    expect(en.editorial.eventsTitle).toBe("When you are there.");
    expect(cs.sluzby.business.packages).toEqual(businessPackages);
  });
});
