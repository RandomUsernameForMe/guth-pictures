// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { signGalleryToken, verifyGalleryToken } from "../gallery-auth";

afterEach(() => vi.useRealTimers());

describe("verifyGalleryToken", () => {
  it("accepts a token signed after notBefore", async () => {
    const token = await signGalleryToken("a");
    expect(await verifyGalleryToken(token, "a", Date.now() - 1000)).toBe(true);
  });

  it("rejects a token signed before notBefore (gallery recreated)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = await signGalleryToken("a");
    const createdAt = Date.parse("2026-02-01T00:00:00Z");
    expect(await verifyGalleryToken(token, "a", createdAt)).toBe(false);
  });

  it("rejects a token for a different slug", async () => {
    const token = await signGalleryToken("a");
    expect(await verifyGalleryToken(token, "b")).toBe(false);
  });
});
