import { isAuthenticated } from "@/lib/auth";
import { listProposals } from "@/modules/brand-shoot/lib/proposals";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const proposals = await listProposals();
  return NextResponse.json({ proposals });
}
