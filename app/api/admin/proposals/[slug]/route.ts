import { isAuthenticated } from "@/lib/auth";
import {
  getProposal,
  setApprovals,
  setAssignments,
  setFinalized,
  setPassword,
  deleteProposal,
  type ApprovalPatch,
  type AssignmentPatch,
} from "@/modules/brand-shoot/lib/proposals";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const proposal = await getProposal(slug);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ proposal });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  let body: {
    action?: unknown;
    patch?: ApprovalPatch & AssignmentPatch;
    finalized?: unknown;
    password?: unknown;
    expiryDays?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (body.action) {
    case "approvals": {
      const updated = await setApprovals(slug, body.patch ?? {});
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ proposal: updated });
    }
    case "assign": {
      const updated = await setAssignments(slug, body.patch ?? {});
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ proposal: updated });
    }
    case "finalize": {
      const updated = await setFinalized(slug, body.finalized === true);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ proposal: updated });
    }
    case "password": {
      if (typeof body.password !== "string" || body.password.length < 8) {
        return NextResponse.json({ error: "Password too short (min 8 chars)" }, { status: 400 });
      }
      const expiryDays =
        typeof body.expiryDays === "number" ? Math.max(1, Math.min(365, body.expiryDays)) : undefined;
      const updated = await setPassword(slug, body.password, expiryDays);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  await deleteProposal(slug);
  return NextResponse.json({ ok: true });
}
