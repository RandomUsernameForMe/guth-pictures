import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  shootFromPath, sortShoots, countByShoot, canAdd, buildStatus, isCategory, matchShoot, toWebPhoto,
} from "../portfolio/core";

const root = path.join("drive", "Guthovo fotky");

describe("shootFromPath", () => {
  it("vrátí složku nejvyšší úrovně", () => {
    expect(shootFromPath(root, path.join(root, "2026 9 - Kamča", "A1.jpg"))).toBe("2026 9 - Kamča");
  });
  it("podsložka patří k nadřazenému shootu", () => {
    expect(shootFromPath(root, path.join(root, "2025 6 - Divoké focení", "Druidka", "x.jpg")))
      .toBe("2025 6 - Divoké focení");
  });
  it("soubor přímo v rootu nemá shoot", () => {
    expect(shootFromPath(root, path.join(root, "x.jpg"))).toBeNull();
  });
  it("soubor mimo root nemá shoot", () => {
    expect(shootFromPath(root, path.join("jinde", "a", "x.jpg"))).toBeNull();
  });
  it("normalizuje NFD na NFC", () => {
    const nfd = "Kamc\u030Ca";
    expect(shootFromPath(root, path.join(root, nfd, "x.jpg"))).toBe("Kamča");
  });
});

describe("sortShoots", () => {
  it("řadí podle roku a měsíce sestupně, nečíselné na konec", () => {
    expect(sortShoots(["2026 9 - A", "Akano", "2026 10 - B", "2026 01 - C", "2025 12 - D"]))
      .toEqual(["2026 10 - B", "2026 9 - A", "2026 01 - C", "2025 12 - D", "Akano"]);
  });
});

describe("countByShoot / canAdd", () => {
  const photos = [
    { publicId: "p1", shoot: "A" },
    { publicId: "p2", shoot: "A" },
    { publicId: "p3", shoot: "B" },
    { publicId: "p4" },
  ];
  it("počítá fotky na shoot a ignoruje bez shootu", () => {
    expect(Object.fromEntries(countByShoot(photos))).toEqual({ A: 2, B: 1 });
  });
  it("canAdd hlídá limit", () => {
    expect(canAdd(photos, "A")).toBe(false);
    expect(canAdd(photos, "B")).toBe(true);
    expect(canAdd(photos, "C")).toBe(true);
  });
});

describe("buildStatus", () => {
  it("najde porušení, fotky bez shootu a neznámé shooty (i přes NFD)", () => {
    const report = buildStatus(
      ["Kamča", "B"],
      [
        { publicId: "1", shoot: "Kamc\u030Ca" },
        { publicId: "2", shoot: "B" }, { publicId: "3", shoot: "B" }, { publicId: "4", shoot: "B" },
        { publicId: "5", shoot: "Smazaný" },
        { publicId: "6" },
      ],
    );
    expect(report.rows).toEqual([{ shoot: "Kamča", count: 1 }, { shoot: "B", count: 3 }]);
    expect(report.violations).toEqual([{ shoot: "B", count: 3 }]);
    expect(report.untagged).toEqual(["6"]);
    expect(report.unknownShoots).toEqual(["Smazaný"]);
    expect(report.total).toBe(6);
  });
});

describe("isCategory", () => {
  it("přijme jen známé kategorie", () => {
    expect(isCategory("larpy")).toBe(true);
    expect(isCategory("krajina")).toBe(false);
  });
});

describe("matchShoot", () => {
  const shoots = ["2026 9 - Kamča", "B"];
  it("vrátí kanonický název z disku i při jiné velikosti písmen a NFD", () => {
    expect(matchShoot(shoots, "2026 9 - kamča")).toBe("2026 9 - Kamča");
  });
  it("neznámý shoot → undefined", () => {
    expect(matchShoot(shoots, "C")).toBeUndefined();
  });
});

describe("toWebPhoto", () => {
  it("čte shoot z Admin API tvaru context.custom", () => {
    expect(toWebPhoto({ public_id: "p1", context: { custom: { shoot: "A" } } }))
      .toEqual({ publicId: "p1", shoot: "A" });
  });
  it("bez contextu nemá shoot", () => {
    expect(toWebPhoto({ public_id: "p2" })).toEqual({ publicId: "p2", shoot: undefined });
  });
});
