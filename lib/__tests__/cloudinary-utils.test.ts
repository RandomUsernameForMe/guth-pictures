import { describe, it, expect, beforeEach } from "vitest";
import { cloudinaryUrl, blurUrl, CATEGORIES, toGalleryPhoto } from "@/lib/cloudinary-utils";

describe("cloudinaryUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
  });

  it("vrátí URL bez transformace", () => {
    const url = cloudinaryUrl("portfolio/foto1.jpg");
    expect(url).toBe(
      "https://res.cloudinary.com/testcloud/image/upload/portfolio/foto1.jpg"
    );
  });

  it("vrátí URL s transformací", () => {
    const url = cloudinaryUrl("portfolio/foto1.jpg", "w_800,q_auto");
    expect(url).toBe(
      "https://res.cloudinary.com/testcloud/image/upload/w_800,q_auto/portfolio/foto1.jpg"
    );
  });

  it("prázdná transformace se chová jako žádná", () => {
    const url = cloudinaryUrl("portfolio/foto1.jpg", "");
    expect(url).toBe(
      "https://res.cloudinary.com/testcloud/image/upload/portfolio/foto1.jpg"
    );
  });
});

describe("blurUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
  });

  it("obsahuje blur transformaci", () => {
    const url = blurUrl("portfolio/foto1.jpg");
    expect(url).toContain("e_blur:1000");
    expect(url).toContain("w_20");
    expect(url).toContain("portfolio/foto1.jpg");
  });
});

describe("CATEGORIES", () => {
  it("obsahuje správné kategorie", () => {
    expect(CATEGORIES).toContain("portréty");
    expect(CATEGORIES).toContain("svatby");
  });

  it("je readonly tuple se dvěma položkami", () => {
    expect(CATEGORIES).toHaveLength(2);
  });
});

describe("toGalleryPhoto", () => {
  const base = { public_id: "portfolio/a", width: 100, height: 200 };

  it("neznámou kategorii převede na portréty s fallback alt", () => {
    const photo = toGalleryPhoto({ ...base, context: { category: "eventy" } });
    expect(photo.category).toBe("portréty");
    expect(photo.alt.cs).not.toBe("");
    expect(photo.alt.en).not.toBe("");
  });

  it("platnou kategorii zachová a explicitní alt má přednost", () => {
    const photo = toGalleryPhoto({ ...base, context: { category: "larpy", alt_cs: "Popis" } });
    expect(photo.category).toBe("larpy");
    expect(photo.alt.cs).toBe("Popis");
    expect(photo.alt.en).not.toBe("");
  });
});
