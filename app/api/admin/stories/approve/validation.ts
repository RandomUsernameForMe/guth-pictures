const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;

export type ApproveBody = { draftId: string; videoPublicId: string; publishAt: string };

/** Vrací chybovou hlášku, nebo null když je body validní. */
export function validateApproveBody(body: Record<string, unknown>): string | null {
  if (typeof body.draftId !== "string" || !body.draftId) return "Invalid draftId";
  if (
    typeof body.videoPublicId !== "string" ||
    !CLOUDINARY_ID_RE.test(body.videoPublicId) ||
    body.videoPublicId.includes("..")
  ) return "Invalid videoPublicId";
  if (typeof body.publishAt !== "string" || Number.isNaN(Date.parse(body.publishAt))) return "Invalid publishAt";
  return null;
}
