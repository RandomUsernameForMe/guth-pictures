import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getDrafts, saveDrafts } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ drafts: await getDrafts() });
}

// vytvoření ručního návrhu
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const draft: StoryDraft = {
    id: `d-${Date.now()}`,
    template: body.template === "D" ? "D" : "C",
    photos: [], headline: "", sub: "", words: [], subHeadline: "",
    textSource: "manual",
    createdAt: new Date().toISOString(),
  };
  const drafts = await getDrafts();
  await saveDrafts([draft, ...drafts]);
  return NextResponse.json({ draft });
}

// úprava návrhu (full replace podle id)
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { draft } = body as { draft?: StoryDraft };
  if (!draft?.id) return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  const drafts = await getDrafts();
  if (!drafts.some(d => d.id === draft.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await saveDrafts(drafts.map(d => (d.id === draft.id ? draft : d)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const drafts = await getDrafts();
  await saveDrafts(drafts.filter(d => d.id !== id));
  return NextResponse.json({ ok: true });
}
