import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getThemeColors, setThemeColors, defaultColors, type ThemeColors, type ColorSet } from "@/lib/theme";

const HEX = /^#[0-9a-fA-F]{6}$/;

function isValidColorSet(o: unknown): o is ColorSet {
  if (!o || typeof o !== "object" || Array.isArray(o)) return false;
  const c = o as Record<string, unknown>;
  const keys: (keyof ColorSet)[] = ["bg", "bgElevated", "bgOverlay", "surface", "text", "textMuted", "textGhost", "accent", "accentHover"];
  return keys.every((k) => typeof c[k] === "string" && HEX.test(c[k] as string));
}

function isValidThemeColors(b: unknown): b is ThemeColors {
  if (!b || typeof b !== "object" || Array.isArray(b)) return false;
  const o = b as Record<string, unknown>;
  return isValidColorSet(o.dark) && isValidColorSet(o.light);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const colors = await getThemeColors();
  return NextResponse.json(colors);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!isValidThemeColors(body)) {
    return NextResponse.json({ error: "Invalid color data" }, { status: 400 });
  }
  await setThemeColors(body);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await setThemeColors(defaultColors);
  return NextResponse.json({ ok: true });
}
