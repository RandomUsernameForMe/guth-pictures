import { NextRequest, NextResponse } from "next/server";
import { getProposal, addFeedback } from "@/modules/brand-shoot/lib/proposals";
import { verifyProposalToken, proposalCookieName } from "@/modules/brand-shoot/lib/proposal-auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const { slug } = await params;

  // Only clients with a valid proposal session may submit.
  const token = request.cookies.get(proposalCookieName(slug))?.value;
  if (!token || !(await verifyProposalToken(token, slug))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";
  if (!(await checkRateLimit(`proposal-feedback:${slug}:${ip}`, 10, 60 * 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { conceptId?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: "Message required (max 2000 chars)" }, { status: 400 });
  }

  const proposal = await getProposal(slug);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const conceptId =
    typeof body.conceptId === "string" && proposal.concepts.some((c) => c.id === body.conceptId)
      ? body.conceptId
      : undefined;

  if (!(await addFeedback(slug, { conceptId, message }))) {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  notifyFormspree(proposal.name, conceptId, message);
  return NextResponse.json({ ok: true });
}

// Fire-and-forget email notification through the same Formspree form the contact page uses.
function notifyFormspree(name: string, conceptId: string | undefined, message: string) {
  const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID;
  if (!formId) return;
  fetch(`https://formspree.io/f/${formId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `Reakce na návrh — ${name}`,
      concept: conceptId ?? "—",
      message,
    }),
  }).catch(() => {});
}
