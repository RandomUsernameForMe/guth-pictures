import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getContent, setContent, type ContentData } from "@/lib/content";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = req.nextUrl.searchParams.get("locale") ?? "cs";
  const data = await getContent(locale);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { locale, data } = (await req.json()) as { locale: string; data: ContentData };
  await setContent(locale, data);
  revalidatePath("/");
  revalidatePath("/en");
  return NextResponse.json({ ok: true });
}
