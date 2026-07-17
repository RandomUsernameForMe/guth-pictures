import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDrafts, saveDrafts, getQueue, saveQueue } from "@/modules/stories/lib/store";
import { validateApproveBody, type ApproveBody } from "./validation";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
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
