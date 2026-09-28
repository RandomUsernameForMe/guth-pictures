import { describe, expect, it } from "vitest";
import {
  isValidEditorialImages,
  isValidImagesPayload,
} from "@/app/api/admin/images/route";
import type { EditorialImage, EditorialImages } from "@/modules/admin/lib/content";

const image = (publicId = "portfolio/example"): EditorialImage => ({
  publicId,
  alt: { cs: "Český popis", en: "English description" },
  focal: { desktop: "50% 50%", mobile: "40% 60%" },
});

function validEditorialImages(): EditorialImages {
  return {
    home: {
      hero: image(),
      stories: [image("portfolio/story")],
      photographer: image("site/photographer"),
      tools: { foceni101: image("site/foceni"), lightPlanner: image("site/light") },
    },
    portrait: { hero: image(), gallery: [image()] },
    business: { hero: image(""), headshots: [image("")], atWork: [image("")] },
    events: { hero: image(""), reportage: [image("")] },
  };
}

describe("editorial image validation", () => {
  it("accepts complete editorial images and a legacy profile-only payload", () => {
    expect(isValidEditorialImages(validEditorialImages())).toBe(true);
    expect(isValidImagesPayload({ profile: "site/me" })).toBe(true);
  });

  it("rejects unknown keys", () => {
    expect(isValidEditorialImages({ ...validEditorialImages(), extra: image() })).toBe(false);
  });

  it.each(["javascript:x", "portfolio/with space"])("rejects unsafe public id %s", (publicId) => {
    const data = validEditorialImages();
    data.business.hero.publicId = publicId;
    expect(isValidEditorialImages(data)).toBe(false);
  });

  it("rejects oversized alt text", () => {
    const data = validEditorialImages();
    data.home.hero.alt.cs = "x".repeat(201);
    expect(isValidEditorialImages(data)).toBe(false);
  });

  it("rejects malformed focal points", () => {
    const data = validEditorialImages();
    data.portrait.hero.focal.desktop = "center";
    expect(isValidEditorialImages(data)).toBe(false);
  });

  it("rejects image arrays over twelve entries", () => {
    const data = validEditorialImages();
    data.events.reportage = Array.from({ length: 13 }, () => image(""));
    expect(isValidEditorialImages(data)).toBe(false);
  });
});
