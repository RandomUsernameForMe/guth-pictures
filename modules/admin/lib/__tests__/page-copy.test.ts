import { describe, it, expect } from "vitest";
import { defaultPageCopy, isValidPageCopy, normalizePageCopy } from "../page-copy";

describe("normalizePageCopy", () => {
  it("returns locale defaults for legacy content without pages", () => {
    expect(normalizePageCopy(undefined, "en").home.title).toBe("A different view.");
    expect(normalizePageCopy(undefined, "cs").home.title).toBe("Jiný pohled.");
  });

  it("keeps stored texts and fills missing fields from defaults", () => {
    const copy = normalizePageCopy({ home: { title: "Vlastní nadpis" } }, "cs");
    expect(copy.home.title).toBe("Vlastní nadpis");
    expect(copy.home.intro).toBe(defaultPageCopy("cs").home.intro);
    expect(copy.business.faq.length).toBeGreaterThan(0);
  });

  it("uses stored list length and fills missing item fields", () => {
    const copy = normalizePageCopy({ services: { faq: [{ q: "Otázka?" }] } }, "cs");
    expect(copy.services.faq).toHaveLength(1);
    expect(copy.services.faq[0].q).toBe("Otázka?");
    expect(typeof copy.services.faq[0].a).toBe("string");
  });

  it("ignores stored values of the wrong type", () => {
    const copy = normalizePageCopy({ home: { title: 42 }, portrait: { steps: "x" } }, "cs");
    expect(copy.home.title).toBe("Jiný pohled.");
    expect(copy.portrait.steps).toEqual(defaultPageCopy("cs").portrait.steps);
  });
});

describe("isValidPageCopy", () => {
  it("accepts full defaults and partial copy", () => {
    expect(isValidPageCopy(defaultPageCopy("cs"))).toBe(true);
    expect(isValidPageCopy(defaultPageCopy("en"))).toBe(true);
    expect(isValidPageCopy({ home: { title: "X" } })).toBe(true);
  });

  it("rejects unknown keys, prototype keys and wrong types", () => {
    expect(isValidPageCopy({ hacker: {} })).toBe(false);
    expect(isValidPageCopy({ home: { constructor: "x" } })).toBe(false);
    expect(isValidPageCopy({ home: { title: 1 } })).toBe(false);
    expect(isValidPageCopy({ services: { faq: [{ q: "a", extra: "b" }] } })).toBe(false);
    expect(isValidPageCopy("text")).toBe(false);
  });

  it("rejects oversized texts and lists", () => {
    expect(isValidPageCopy({ home: { title: "x".repeat(2001) } })).toBe(false);
    expect(isValidPageCopy({ portrait: { steps: Array(31).fill("krok") } })).toBe(false);
  });
});
