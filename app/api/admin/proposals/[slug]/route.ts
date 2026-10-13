import { readJson, requireAdmin } from "@/lib/admin-route";
import {
  getProposal,
  setApprovals,
  setAssignments,
  setFinalized,
  setPassword,
  deleteProposal,
  editConcept,
  type ApprovalPatch,
  type AssignmentPatch,
  type ConceptTextFields,
} from "@/modules/brand-shoot/lib/proposals";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  const proposal = await getProposal(slug);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ proposal });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;

  const body = await readJson<{
    action?: unknown;
    patch?: ApprovalPatch & AssignmentPatch;
    finalized?: unknown;
    password?: unknown;
    expiryDays?: unknown;
    conceptId?: unknown;
    fields?: unknown;
  }>(request);
  if (body instanceof NextResponse) return body;

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
    case "editConcept": {
      const conceptId = typeof body.conceptId === "string" ? body.conceptId : "";
      const allowed = [
        "title", "pitch", "why", "mood", "wardrobe", "location", "lighting", "poseDirection",
      ] as const;
      const raw = (body.fields ?? {}) as Record<string, unknown>;
      const fields: ConceptTextFields = {};
      for (const k of allowed) {
        if (typeof raw[k] === "string") fields[k] = (raw[k] as string).trim();
      }
      if (!conceptId || (fields.title !== undefined && !fields.title)) {
        return NextResponse.json({ error: "conceptId and non-empty title required" }, { status: 400 });
      }
      const updated = await editConcept(slug, conceptId, fields);
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ proposal: updated });
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { slug } = await params;
  await deleteProposal(slug);
  return NextResponse.json({ ok: true });
}
