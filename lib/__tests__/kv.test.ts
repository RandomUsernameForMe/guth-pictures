import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
const { mockKv } = vi.hoisted(() => ({ mockKv: { __mock: true } }));
vi.mock("@vercel/kv", () => ({ kv: mockKv }));

import { getKv } from "@/lib/kv";

const KEYS = ["KV_REST_API_URL", "KV_REST_API_TOKEN"] as const;
const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

describe("getKv", () => {
  beforeEach(() => {
    for (const k of KEYS) delete process.env[k];
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  });

  it("returns null without KV_REST_API_URL", async () => {
    process.env.KV_REST_API_TOKEN = "token";
    expect(await getKv()).toBeNull();
  });

  it("returns null without KV_REST_API_TOKEN", async () => {
    process.env.KV_REST_API_URL = "https://kv.example.com";
    expect(await getKv()).toBeNull();
  });

  it("returns kv from @vercel/kv when both vars are set", async () => {
    process.env.KV_REST_API_URL = "https://kv.example.com";
    process.env.KV_REST_API_TOKEN = "token";
    expect(await getKv()).toBe(mockKv);
  });
});
