import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-route";
import { getThemeColors, setThemeColors, defaultColors, type ColorSet } from "@/lib/theme";
import { COLOR_KEYS } from "@/lib/theme-types";

const HEX = /^#[0-9a-fA-F]{6}$/;

function isValidColorSet(o: unknown): o is ColorSet {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  const c = o as Record<string, unknown>;
  return COLOR_KEYS.every((k) => typeof c[k] === "string" && HEX.test(c[k] as string));
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const colors = await getThemeColors();
  return NextResponse.json(colors);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json();
  if (!isValidColorSet(body)) {
    return NextResponse.json({ error: "Invalid color data" }, { status: 400 });
  }
  await setThemeColors(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await setThemeColors(defaultColors);
  return NextResponse.json({ ok: true });
}
