import { NextRequest, NextResponse } from "next/server";
import { getGalleryPhotos } from "@/lib/cloudinary";
import { composeDrafts } from "@/modules/stories/lib/compose";
import { suggestTexts } from "@/modules/stories/lib/claude";
import { getTexts, saveTexts, getDrafts, saveDrafts, getUsedPhotoIds, markPhotosUsed } from "@/modules/stories/lib/store";
import type { StoryDraft } from "@/modules/stories/lib/types";

const DRAFT_COUNT = 4;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await getGalleryPhotos("portfolio");
  // preferuj kurátorský výběr (tag selected_work), fallback na vše
  const selected = photos.filter(p => p.selected);
  const pool = selected.length >= DRAFT_COUNT * 3 ? selected : photos;

  // AI návrhy textů — best effort, výpadek Claude nesmí shodit cron
  let texts = await getTexts();
  try {
    const categories = [...new Set(pool.map(p => p.category))];
    const aiTexts = await suggestTexts(categories);
    texts = [...aiTexts, ...texts];
    await saveTexts(texts);
  } catch (err) {
    console.error("[stories-drafts] AI texts failed:", err);
  }

  const usedIds = await getUsedPhotoIds();
  const { drafts: composed, usedNow } = composeDrafts({ photos: pool, usedIds, texts, count: DRAFT_COUNT });

  const stamp = Date.now();
  const drafts: StoryDraft[] = composed.map((d, i) => ({
    ...d, id: `d-${stamp}-${i}`, createdAt: new Date().toISOString(),
  }));

  await saveDrafts([...drafts, ...(await getDrafts())]);
  await markPhotosUsed(usedNow);

  return NextResponse.json({ ok: true, created: drafts.length });
}
