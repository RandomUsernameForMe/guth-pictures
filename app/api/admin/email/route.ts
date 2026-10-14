import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-route";
import { getContactEmail, setContactEmail } from "@/modules/admin/lib/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const email = await getContactEmail();
  return NextResponse.json({ email });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  const { email } = body ?? {};
  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  await setContactEmail(email);
  revalidatePath("/cs");
  revalidatePath("/en");
  return NextResponse.json({ ok: true });
}
