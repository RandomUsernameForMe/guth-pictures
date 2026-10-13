import { NextRequest, NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ queue: await getQueue() });
}

// re-queue failed položky (případně s novým časem)
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (body instanceof NextResponse) return body;
  const { id, publishAt } = body as { id?: string; publishAt?: string };
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (publishAt !== undefined && (typeof publishAt !== "string" || Number.isNaN(Date.parse(publishAt)))) return NextResponse.json({ error: "Invalid publishAt" }, { status: 400 });
  const queue = await getQueue();
  if (!queue.some(item => item.id === id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveQueue(queue.map(item =>
    item.id === id
      ? { ...item, status: "queued", error: undefined, publishAt: publishAt ?? item.publishAt }
      : item,
  ));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await saveQueue((await getQueue()).filter(item => item.id !== id));
  return NextResponse.json({ ok: true });
}
