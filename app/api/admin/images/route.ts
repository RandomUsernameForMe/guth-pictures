import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getImages, setImages } from "@/lib/content";

const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-.\/]{1,200}$/;

function isValidPublicId(id: unknown): boolean {
  return id === "" || (typeof id === "string" && CLOUDINARY_ID_RE.test(id));
}

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
  const body = await req.json();
  const { hero, profile } = body ?? {};
  if (!isValidPublicId(hero) || !isValidPublicId(profile)) {
    return NextResponse.json({ error: "Invalid public ID" }, { status: 400 });
  }
  await setImages({ hero, profile });
  revalidatePath("/cs");
  revalidatePath("/en");
  return NextResponse.json({ ok: true });
}
