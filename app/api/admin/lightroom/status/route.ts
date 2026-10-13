import { requireAdmin } from "@/lib/admin-route";
import { getTokens } from "@/modules/gallery/lib/lightroom";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const tokens = await getTokens();
  return NextResponse.json({ connected: !!tokens });
}
