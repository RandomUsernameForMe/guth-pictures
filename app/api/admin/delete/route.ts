import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";
import { requireAdmin, readJson } from "@/lib/admin-route";
import { getImages, type NormalizedSiteImages } from "@/modules/admin/lib/content";

const CLOUDINARY_ID_RE = /^[a-zA-Z0-9_\-/.]+$/;

type Usage = { path: string; publicId: string };

function collectUsages(images: NormalizedSiteImages): Usage[] {
  const usages: Usage[] = [{ path: "profile", publicId: images.profile }];
  images.heroTriptych?.forEach((panel, i) =>
    panel.forEach((publicId, j) => usages.push({ path: `heroTriptych[${i}][${j}]`, publicId }))
  );
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (typeof obj.publicId === "string") usages.push({ path, publicId: obj.publicId });
      else Object.entries(obj).forEach(([k, v]) => walk(v, `${path}.${k}`));
    }
  };
  walk(images.editorial, "editorial");
  return usages;
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await readJson<{ publicId?: unknown }>(request);
  if (body instanceof NextResponse) return body;
  const publicId = body?.publicId;

  if (typeof publicId !== "string" || !publicId.trim() || !CLOUDINARY_ID_RE.test(publicId)) {
    return NextResponse.json({ error: "Invalid publicId" }, { status: 400 });
  }

  const usage = collectUsages(await getImages()).find((u) => u.publicId === publicId);
  if (usage) {
    return NextResponse.json(
      { error: `Fotka je použitá na webu (${usage.path}). Nejdřív ji nahraď.` },
      { status: 409 }
    );
  }

  await cloudinary.uploader.destroy(publicId);
  console.log(`[delete] publicId=${publicId}`);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
