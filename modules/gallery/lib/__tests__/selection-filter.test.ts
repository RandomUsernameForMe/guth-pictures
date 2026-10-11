import { describe, expect, it } from "vitest";
import { filterPhotos, stepPhoto } from "@/modules/gallery/lib/selection-filter";

const photos = ["a", "b", "c", "d", "e"].map((lrId) => ({ lrId }));

describe("filterPhotos", () => {
  it("vrací jen oblíbené v původním pořadí", () => {
    const favs = new Set(["d", "b", "e"]);
    expect(filterPhotos(photos, favs, true).map((p) => p.lrId)).toEqual(["b", "d", "e"]);
  });

  it("bez filtru vrací všechny fotky", () => {
    expect(filterPhotos(photos, new Set(["a"]), false)).toBe(photos);
  });

  it("prázdný výběr dá []", () => {
    expect(filterPhotos(photos, new Set(), true)).toEqual([]);
  });
});

describe("stepPhoto", () => {
  const list = filterPhotos(photos, new Set(["b", "d", "e"]), true);

  it("cyklí vpřed jen v rámci seznamu", () => {
    expect(stepPhoto(list, "b", 1)?.lrId).toBe("d");
    expect(stepPhoto(list, "d", 1)?.lrId).toBe("e");
    expect(stepPhoto(list, "e", 1)?.lrId).toBe("b");
  });

  it("cyklí vzad jen v rámci seznamu", () => {
    expect(stepPhoto(list, "e", -1)?.lrId).toBe("d");
    expect(stepPhoto(list, "d", -1)?.lrId).toBe("b");
    expect(stepPhoto(list, "b", -1)?.lrId).toBe("e");
  });

  it("vrací null pro prázdný seznam", () => {
    expect(stepPhoto([], "a", 1)).toBeNull();
  });

  it("když currentId není v seznamu, vpřed první a vzad poslední", () => {
    expect(stepPhoto(list, "a", 1)?.lrId).toBe("b");
    expect(stepPhoto(list, "a", -1)?.lrId).toBe("e");
  });
});
