import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getContent, setContent, type ContentData } from "@/modules/admin/lib/content";

const ALLOWED_LOCALES = ["cs", "en"] as const;
type AllowedLocale = typeof ALLOWED_LOCALES[number];

function isAllowedLocale(l: unknown): l is AllowedLocale {
  return ALLOWED_LOCALES.includes(l as AllowedLocale);
}

const MAX_SHORT = 200;
const MAX_LONG = 2000;
const MAX_PACKAGES = 10;
const MAX_INCLUDES = 20;
const MAX_TESTIMONIALS = 30;

function isPackages(v: unknown): boolean {
  if (!Array.isArray(v) || v.length > MAX_PACKAGES) return false;
  return v.every((p) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) return false;
    const pkg = p as Record<string, unknown>;
    if (typeof pkg.name !== "string" || pkg.name.length > MAX_SHORT) return false;
    if (typeof pkg.price !== "string" || pkg.price.length > MAX_SHORT) return false;
    if (typeof pkg.duration !== "string" || pkg.duration.length > MAX_SHORT) return false;
    if (!Array.isArray(pkg.includes) || pkg.includes.length > MAX_INCLUDES) return false;
    return pkg.includes.every((i) => typeof i === "string" && i.length <= MAX_SHORT);
  });
}

function isServiceContent(s: unknown): boolean {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const o = s as Record<string, unknown>;
  if (typeof o.title !== "string" || o.title.length > MAX_SHORT) return false;
  if (typeof o.desc !== "string" || o.desc.length > MAX_LONG) return false;
  if (o.note !== undefined && (typeof o.note !== "string" || o.note.length > MAX_LONG)) return false;
  if (o.extras !== undefined && !isPackages(o.extras)) return false;
  // packages is optional for backward compat with KV data saved before this field existed
  return o.packages === undefined || isPackages(o.packages);
}

function isTestimonials(v: unknown): boolean {
  if (v === undefined) return true; // optional for legacy KV data
  if (!Array.isArray(v) || v.length > MAX_TESTIMONIALS) return false;
  return v.every((t) => {
    if (!t || typeof t !== "object" || Array.isArray(t)) return false;
    const o = t as Record<string, unknown>;
    if (typeof o.quote !== "string" || o.quote.length === 0 || o.quote.length > MAX_LONG) return false;
    if (typeof o.author !== "string" || o.author.length === 0 || o.author.length > MAX_SHORT) return false;
    if (o.id !== undefined && (typeof o.id !== "string" || o.id.length > MAX_SHORT)) return false;
    if (o.role !== undefined && (typeof o.role !== "string" || o.role.length > MAX_SHORT)) return false;
    if (o.photo !== undefined && (typeof o.photo !== "string" || o.photo.length > MAX_SHORT)) return false;
    return true;
  });
}

function isEditorialCopy(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const editorial = value as Record<string, unknown>;
  if (Object.keys(editorial).some((key) => key !== "eventsTitle")) return false;
  return typeof editorial.eventsTitle === "string"
    && editorial.eventsTitle.length > 0
    && editorial.eventsTitle.length <= MAX_SHORT;
}

export function isValidContentData(d: unknown): d is ContentData {
  if (!d || typeof d !== "object" || Array.isArray(d)) return false;
  const o = d as Record<string, unknown>;
  if (!o.home || typeof o.home !== "object") return false;
  if (!o["o-mne"] || typeof o["o-mne"] !== "object") return false;
  if (!o.sluzby || typeof o.sluzby !== "object" || Array.isArray(o.sluzby)) return false;
  if (!isTestimonials(o.testimonials)) return false;
  if (!isEditorialCopy(o.editorial)) return false;
  const s = o.sluzby as Record<string, unknown>;
  // business is optional for backward compat with KV data saved before the business page existed
  return isServiceContent(s.portraits) && isServiceContent(s.weddings)
    && (s.business === undefined || isServiceContent(s.business));
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
  revalidatePath("/cs/firemni-portrety");
  revalidatePath("/en/firemni-portrety");
  revalidatePath("/cs/sluzby/portretni-foceni");
  revalidatePath("/en/sluzby/portretni-foceni");
  revalidatePath("/cs/sluzby/eventy-a-svatby");
  revalidatePath("/en/sluzby/eventy-a-svatby");
  revalidatePath("/cs/o-mne");
  revalidatePath("/en/o-mne");
  return NextResponse.json({ ok: true });
}
