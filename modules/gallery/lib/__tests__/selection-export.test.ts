import { describe, it, expect } from "vitest";
import type { GalleryPhoto } from "../gallery";
import { formatFilenamesForCopy, formatFilenamesForTxt } from "../selection-export";

const photo = (lrId: string, filename: string): GalleryPhoto => ({
  lrId,
  cloudinaryId: `c-${lrId}`,
  filename,
  width: 1,
  height: 1,
});

const photos = [photo("a", "DSC_0012.jpg"), photo("b", "DSC_0020.jpg"), photo("c", "DSC_0040.jpg")];

describe("selection-export", () => {
  it("řadí podle galerie, ne podle výběru", () => {
    expect(formatFilenamesForCopy(photos, ["c", "a"])).toBe("DSC_0012.jpg, DSC_0040.jpg");
  });

  it("vynechá lrId, které v galerii nejsou", () => {
    expect(formatFilenamesForCopy(photos, ["x", "b"])).toBe("DSC_0020.jpg");
  });

  it("prázdný výběr dá prázdný výstup", () => {
    expect(formatFilenamesForCopy(photos, [])).toBe("");
    expect(formatFilenamesForTxt(photos, [])).toBe("");
  });

  it("txt má jeden název na řádek", () => {
    expect(formatFilenamesForTxt(photos, ["c", "a"])).toBe("DSC_0012.jpg\nDSC_0040.jpg\n");
  });
});
