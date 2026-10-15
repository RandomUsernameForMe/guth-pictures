import { describe, expect, it } from "vitest";
import { formatGalleryInvite } from "../gallery-invite";

const base = {
  url: "https://guthpictures.eu/gallery/novakovi",
  password: "tajne123",
  expiresAt: "2026-03-05T12:00:00.000Z",
};

describe("formatGalleryInvite", () => {
  it("obsahuje URL, heslo a datum ve formátu D. M. RRRR", () => {
    const text = formatGalleryInvite(base);
    expect(text).toContain(base.url);
    expect(text).toContain("tajne123");
    expect(text).toContain("5. 3. 2026");
  });

  it("větu o limitu přidá jen při maxSelection", () => {
    expect(formatGalleryInvite(base)).not.toContain("nejvýše");
    expect(formatGalleryInvite({ ...base, maxSelection: 20 })).toContain("nejvýše 20 fotek");
  });
});
