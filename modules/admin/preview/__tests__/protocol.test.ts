import { describe, expect, it } from "vitest";
import { isPreviewPage } from "../protocol";

describe("isPreviewPage", () => {
  it.each(["home", "portrety", "business", "eventy"])("přijme %s", (page) => {
    expect(isPreviewPage(page)).toBe(true);
  });

  it.each(["toString", "constructor", "__proto__", ""])("odmítne %j", (page) => {
    expect(isPreviewPage(page)).toBe(false);
  });
});
