import { describe, it, expect, vi, beforeEach } from "vitest";

const kvData = new Map<string, unknown>();
vi.mock("@vercel/kv", () => ({
  kv: {
    get: vi.fn(async (key: string) => kvData.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { kvData.set(key, value); }),
  },
}));

import { publishStory, refreshTokenIfNeeded } from "../instagram";

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

beforeEach(() => {
  kvData.clear();
  process.env.KV_REST_API_URL = "https://test";
  process.env.KV_REST_API_TOKEN = "test";
  process.env.IG_USER_ID = "17840000000000000";
  process.env.IG_ACCESS_TOKEN = "seed-token";
  process.env.FB_APP_ID = "app-id";
  process.env.FB_APP_SECRET = "app-secret";
});

describe("publishStory", () => {
  it("creates container, polls until FINISHED, publishes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "IN_PROGRESS" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "media-1" }));
    vi.stubGlobal("fetch", fetchMock);

    const mediaId = await publishStory("https://res.cloudinary.com/x/video/upload/v.mp4", { pollIntervalMs: 0 });
    expect(mediaId).toBe("media-1");
    expect(fetchMock.mock.calls[0][0]).toContain("/17840000000000000/media");
    expect(String(fetchMock.mock.calls[3][0])).toContain("/media_publish");
  });

  it("throws with Graph error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      jsonResponse({ error: { message: "Invalid video" } }, false),
    ));
    await expect(publishStory("https://x/v.mp4", { pollIntervalMs: 0 })).rejects.toThrow("Invalid video");
  });

  it("throws when container processing returns ERROR", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "ERROR" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(publishStory("https://x/v.mp4", { pollIntervalMs: 0 })).rejects.toThrow("container processing failed");
  });
});

describe("refreshTokenIfNeeded", () => {
  it("stores refreshed token in KV when expiry is near", async () => {
    kvData.set("stories:igAuth", {
      accessToken: "old-token",
      expiresAt: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), // za 5 dní
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(
      jsonResponse({ access_token: "new-token", expires_in: 5184000 }),
    ));
    await refreshTokenIfNeeded();
    const auth = kvData.get("stories:igAuth") as { accessToken: string };
    expect(auth.accessToken).toBe("new-token");
  });

  it("refreshes immediately when only env seed token exists (unknown expiry)", async () => {
    // žádný stories:igAuth v KV
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({ access_token: "exchanged", expires_in: 5184000 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await refreshTokenIfNeeded();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const auth = kvData.get("stories:igAuth") as { accessToken: string };
    expect(auth.accessToken).toBe("exchanged");
  });

  it("does nothing when token is fresh", async () => {
    kvData.set("stories:igAuth", {
      accessToken: "fresh",
      expiresAt: new Date(Date.now() + 50 * 24 * 3600 * 1000).toISOString(),
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await refreshTokenIfNeeded();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
