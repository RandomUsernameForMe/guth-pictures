import { getProposal, verifyProposalPassword, isExpired } from "@/modules/brand-shoot/lib/proposals";
import { signProposalToken, proposalCookieName } from "@/modules/brand-shoot/lib/proposal-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  const proposal = await getProposal(slug);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isExpired(proposal)) {
    return NextResponse.json({ error: "Proposal expired" }, { status: 410 });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (typeof body.password !== "string") {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const valid = await verifyProposalPassword(slug, body.password);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await signProposalToken(slug);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: proposalCookieName(slug),
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
