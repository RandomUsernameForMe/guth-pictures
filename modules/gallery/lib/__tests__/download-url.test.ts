import { describe, it, expect } from "vitest";
import { cleanUrl, downloadUrl } from "../download-url";

describe("download-url", () => {
  it("cleanUrl has no text overlay", () => {
    const url = cleanUrl("folder/abc", 600);
    expect(url).not.toContain("l_text");
    expect(url).toContain("w_600");
    expect(url).toContain("folder/abc.jpg");
  });

  it("downloadUrl sets attachment name without extension", () => {
    const url = downloadUrl("folder/abc", "IMG 001.jpg");
    expect(url).toContain("fl_attachment:IMG_001/");
    expect(url).not.toContain("l_text");
  });
});
