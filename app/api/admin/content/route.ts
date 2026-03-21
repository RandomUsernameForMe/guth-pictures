import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getContent, setContent, type ContentData } from "@/lib/content";

const ALLOWED_LOCALES = ["cs", "en"] as const;
type AllowedLocale = typeof ALLOWED_LOCALES[number];

function isAllowedLocale(l: unknown): l is AllowedLocale {
  return ALLOWED_LOCALES.includes(l as AllowedLocale);
}

function isValidContentData(d: unknown): d is ContentData {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  const o = d as Record<string, unknown>;
  return (
    !!o.home && typeof o.home === "object" &&
    !!o["o-mne"] && typeof o["o-mne"] === "object" &&
    !!o.sluzby && typeof o.sluzby === "object"
  );
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const locale = req.nextUrl.searchParams.get("locale") ?? "cs";
  if (!isAllowedLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  const data = await getContent(locale);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { locale, data } = body as { locale: string; data: unknown };
  if (!isAllowedLocale(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  if (!isValidContentData(data)) {
    return NextResponse.json({ error: "Invalid content structure" }, { status: 400 });
  }
  await setContent(locale, data);
  revalidatePath("/cs");
  revalidatePath("/en");
  revalidatePath("/cs/sluzby");
  revalidatePath("/en/sluzby");
  revalidatePath("/cs/o-mne");
  revalidatePath("/en/o-mne");
  return NextResponse.json({ ok: true });
}
