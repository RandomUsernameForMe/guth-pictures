import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ queue: await getQueue() });
}

// re-queue failed položky (případně s novým časem)
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
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
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await saveQueue((await getQueue()).filter(item => item.id !== id));
  return NextResponse.json({ ok: true });
}
