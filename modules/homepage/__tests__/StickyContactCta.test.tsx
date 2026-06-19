import { describe, it, expect } from "vitest";
import { ctaVisible } from "@/modules/homepage/components/StickyContactCta";

describe("ctaVisible", () => {
  it("hidden while hero is visible", () => {
    expect(ctaVisible({ heroVisible: true, contactVisible: false })).toBe(false);
  });
  it("hidden while contact is visible", () => {
    expect(ctaVisible({ heroVisible: false, contactVisible: true })).toBe(false);
  });
  it("visible when neither hero nor contact is in view", () => {
    expect(ctaVisible({ heroVisible: false, contactVisible: false })).toBe(true);
  });
});
