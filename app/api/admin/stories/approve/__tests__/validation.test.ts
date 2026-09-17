import { describe, it, expect } from "vitest";
import { validateApproveBody } from "../validation";

describe("validateApproveBody", () => {
  const valid = {
    draftId: "d-1",
    videoPublicId: "stories/guth-story-123",
    publishAt: "2026-07-20T18:00:00.000Z",
  };

  it("accepts valid body", () => {
    expect(validateApproveBody(valid)).toBeNull();
  });

  it.each([
    ["missing draftId", { ...valid, draftId: undefined }],
    ["invalid publicId chars", { ...valid, videoPublicId: "../../etc" }],
    ["invalid date", { ...valid, publishAt: "not-a-date" }],
  ])("rejects %s", (_label, body) => {
    expect(validateApproveBody(body as Record<string, unknown>)).toBeTruthy();
  });
});
