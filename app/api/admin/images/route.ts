import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getImages, setImages } from "@/modules/admin/lib/content";

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
  const { profile, heroTriptych } = body ?? {};
  if (!isValidPublicId(profile)) {
    return NextResponse.json({ error: "Invalid public ID" }, { status: 400 });
  }
  const current = await getImages();
  let resolvedTriptych: [string[], string[], string[]] | undefined = current.heroTriptych;
  if (heroTriptych !== undefined) {
    if (
      !Array.isArray(heroTriptych) ||
      heroTriptych.length !== 3 ||
      !heroTriptych.every((slot: unknown) => Array.isArray(slot) && slot.every(isValidPublicId))
    ) {
      return NextResponse.json({ error: "Invalid heroTriptych" }, { status: 400 });
    }
    resolvedTriptych = heroTriptych as [string[], string[], string[]];
  }
  await setImages({ profile, heroTriptych: resolvedTriptych });
  revalidatePath("/cs");
  revalidatePath("/en");
  return NextResponse.json({ ok: true });
}
