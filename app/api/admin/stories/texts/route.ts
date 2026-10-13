import { NextRequest, NextResponse } from "next/server";
import { readJson, requireAdmin } from "@/lib/admin-route";
import { getTexts, saveTexts } from "@/modules/stories/lib/store";
import type { StoryTextEntry } from "@/modules/stories/lib/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ texts: await getTexts() });
}

// přidání nového textu (schválený manual)
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<Partial<StoryTextEntry>>(req);
  if (body instanceof NextResponse) return body;
  if (body.template !== "C" && body.template !== "D") {
    return NextResponse.json({ error: "Invalid template" }, { status: 400 });
  }
  const entry: StoryTextEntry = {
    id: `t-${Date.now()}`,
    template: body.template,
    headline: body.headline, sub: body.sub,
    words: body.words, subHeadline: body.subHeadline,
    source: "manual", approved: true,
  };
  await saveTexts([entry, ...(await getTexts())]);
  return NextResponse.json({ text: entry });
}

// úprava/schválení (full replace podle id)
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (body instanceof NextResponse) return body;
  const { text } = body as { text?: StoryTextEntry };
  if (!text?.id) return NextResponse.json({ error: "Invalid text" }, { status: 400 });
  const texts = await getTexts();
  if (!texts.some(t => t.id === text.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveTexts(texts.map(t => (t.id === text.id ? text : t)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await saveTexts((await getTexts()).filter(t => t.id !== id));
  return NextResponse.json({ ok: true });
}
