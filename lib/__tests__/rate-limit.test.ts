import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

// No KV env vars in vitest and NODE_ENV !== "production" → in-memory fallback path.
describe("checkRateLimit (memory fallback)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows up to max attempts, then blocks", async () => {
    for (let i = 0; i < 5; i++) {
      expect(await checkRateLimit("t1:1.2.3.4", 5, 900)).toBe(true);
    }
    expect(await checkRateLimit("t1:1.2.3.4", 5, 900)).toBe(false);
  });

  it("tracks keys independently", async () => {
    for (let i = 0; i < 5; i++) await checkRateLimit("t2:a", 5, 900);
    expect(await checkRateLimit("t2:a", 5, 900)).toBe(false);
    expect(await checkRateLimit("t2:b", 5, 900)).toBe(true);
  });

  it("resets after the window", async () => {
    for (let i = 0; i < 6; i++) await checkRateLimit("t3:x", 5, 900);
    expect(await checkRateLimit("t3:x", 5, 900)).toBe(false);
    vi.advanceTimersByTime(901 * 1000);
    expect(await checkRateLimit("t3:x", 5, 900)).toBe(true);
  });
});
