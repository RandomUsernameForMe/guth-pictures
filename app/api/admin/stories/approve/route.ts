import { NextRequest, NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getDrafts, saveDrafts, getQueue, saveQueue } from "@/modules/stories/lib/store";
import { validateApproveBody, type ApproveBody } from "./validation";

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<Record<string, unknown>>(req);
  if (body instanceof NextResponse) return body;
  const error = validateApproveBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });
  const { draftId, videoPublicId, publishAt } = body as ApproveBody;

  const drafts = await getDrafts();
  const draft = drafts.find(d => d.id === draftId);
  if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  await saveQueue([
    ...(await getQueue()),
    { id: `q-${Date.now()}`, template: draft.template, videoPublicId, publishAt, status: "queued" },
  ]);
  await saveDrafts(drafts.filter(d => d.id !== draftId));
  return NextResponse.json({ ok: true });
}
