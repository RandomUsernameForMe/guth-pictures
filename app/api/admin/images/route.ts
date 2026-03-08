import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getImages, setImages, type SiteImages } from "@/lib/content";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getImages();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = (await req.json()) as SiteImages;
  await setImages(data);
  revalidatePath("/");
  revalidatePath("/en");
  return NextResponse.json({ ok: true });
}
