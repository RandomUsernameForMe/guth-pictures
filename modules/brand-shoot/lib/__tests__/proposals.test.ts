import { describe, it, expect, vi, beforeEach } from "vitest";

// In-memory KV mock shared by all lib functions.
const store = new Map<string, unknown>();
const sets = new Map<string, Set<string>>();
vi.mock("@/lib/kv", () => ({
  getKv: async () => ({
    get: async (k: string) => store.get(k) ?? null,
    set: async (k: string, v: unknown) => void store.set(k, v),
    del: async (k: string) => void store.delete(k),
    smembers: async (k: string) => [...(sets.get(k) ?? [])],
    sadd: async (k: string, v: string) => {
      if (!sets.has(k)) sets.set(k, new Set());
      sets.get(k)!.add(v);
    },
    srem: async (k: string, v: string) => void sets.get(k)?.delete(v),
  }),
}));

import {
  upsertProposal,
  addFeedback,
  markOpened,
  markReviewed,
  editConcept,
} from "@/modules/brand-shoot/lib/proposals";
import type { ProposalSyncPayload, ProposalRecord } from "@/modules/brand-shoot/lib/types";

function payload(): ProposalSyncPayload {
  return {
    slug: "test-client",
    name: "Test Client",
    locale: "cs",
    brief: { date: "2026-07-10" },
    research: "internal",
    concepts: [
      {
        id: "A",
        title: "Original title",
        pitch: "Original pitch",
        why: "why",
        mood: "mood",
        palettes: [{ id: "a-p1", name: "P1", colors: ["#111111"], status: "pending" }],
        wardrobe: "w",
        location: "l",
        lighting: "li",
        shotList: [],
        poseDirection: "pd",
        status: "pending",
      },
    ],
    moodboard: [],
    poses: [],
  };
}

const rec = () => store.get("proposal:test-client") as ProposalRecord;

beforeEach(() => {
  store.clear();
  sets.clear();
});

describe("proposal lib", () => {
  it("editConcept updates fields and sets edited flag", async () => {
    await upsertProposal(payload());
    const updated = await editConcept("test-client", "A", {
      title: "Edited title",
      pitch: "Edited pitch",
    });
    expect(updated?.concepts[0].title).toBe("Edited title");
    expect(updated?.concepts[0].pitch).toBe("Edited pitch");
    expect(updated?.concepts[0].edited).toBe(true);
    expect(updated?.concepts[0].why).toBe("why"); // untouched field survives
  });

  it("upsert preserves admin-edited concept text across re-syncs", async () => {
    await upsertProposal(payload());
    await editConcept("test-client", "A", { title: "Edited title" });
    await upsertProposal(payload()); // re-sync with original text
    expect(rec().concepts[0].title).toBe("Edited title");
    expect(rec().concepts[0].edited).toBe(true);
  });

  it("upsert overwrites text of non-edited concepts", async () => {
    await upsertProposal(payload());
    const p2 = payload();
    p2.concepts[0].title = "New synced title";
    await upsertProposal(p2);
    expect(rec().concepts[0].title).toBe("New synced title");
  });

  it("addFeedback appends and survives re-sync", async () => {
    await upsertProposal(payload());
    expect(await addFeedback("test-client", { conceptId: "A", message: "Love it" })).toBe(true);
    expect(rec().feedback).toHaveLength(1);
    expect(rec().feedback![0].message).toBe("Love it");
    expect(rec().feedback![0].createdAt).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().feedback).toHaveLength(1);
  });

  it("addFeedback caps at 50 entries", async () => {
    await upsertProposal(payload());
    for (let i = 0; i < 55; i++) await addFeedback("test-client", { message: `m${i}` });
    expect(rec().feedback).toHaveLength(50);
    expect(rec().feedback![49].message).toBe("m54");
  });

  it("markOpened sets firstOpenedAt once, lastOpenedAt always; survives re-sync", async () => {
    await upsertProposal(payload());
    await markOpened("test-client");
    const first = rec().firstOpenedAt;
    expect(first).toBeTruthy();
    await markOpened("test-client");
    expect(rec().firstOpenedAt).toBe(first);
    expect(rec().lastOpenedAt).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().firstOpenedAt).toBe(first);
  });

  it("markReviewed sets reviewedAt and survives re-sync", async () => {
    await upsertProposal(payload());
    await markReviewed("test-client");
    const at = rec().reviewedAt;
    expect(at).toBeTruthy();
    await upsertProposal(payload());
    expect(rec().reviewedAt).toBe(at);
  });
});
