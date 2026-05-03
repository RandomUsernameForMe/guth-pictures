import { isAuthenticated } from "@/lib/auth";
import { getTokens } from "@/modules/gallery/lib/lightroom";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const tokens = await getTokens();
  return NextResponse.json({ connected: !!tokens });
}
