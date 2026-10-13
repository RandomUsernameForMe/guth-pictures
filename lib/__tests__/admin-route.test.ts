import { describe, it, expect, vi, beforeEach } from "vitest";

const auth = vi.hoisted(() => ({ ok: false }));
vi.mock("@/lib/auth", () => ({ isAuthenticated: async () => auth.ok }));

import { requireAdmin, readJson } from "../admin-route";

const post = (body: string) => new Request("http://localhost/x", { method: "POST", body });

describe("requireAdmin", () => {
  beforeEach(() => { auth.ok = false; });

  it("returns 401 without a session", async () => {
    const res = await requireAdmin();
    expect(res?.status).toBe(401);
    expect(await res?.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns null with a session", async () => {
    auth.ok = true;
    expect(await requireAdmin()).toBeNull();
  });
});

describe("readJson", () => {
  it("returns 400 on invalid JSON", async () => {
    const res = (await readJson(post("{"))) as Response;
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid JSON" });
  });

  it("returns the parsed body", async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
  });
});
