import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-route";

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
