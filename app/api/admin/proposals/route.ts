import { requireAdmin } from "@/lib/admin-route";
import { listProposals } from "@/modules/brand-shoot/lib/proposals";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const proposals = await listProposals();
  return NextResponse.json({ proposals });
}
