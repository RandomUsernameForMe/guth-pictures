import { NextRequest, NextResponse } from "next/server";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";
import { publishStory, refreshTokenIfNeeded } from "@/modules/stories/lib/instagram";

export const maxDuration = 300; // container poll může trvat minuty

function videoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}.mp4`;
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const queue = await getQueue();
  let published = 0;

  for (const item of queue) {
    if (item.status !== "queued" || new Date(item.publishAt) > now) continue;
    try {
      await publishStory(videoUrl(item.videoPublicId));
      item.status = "published";
      item.error = undefined;
      published++;
    } catch (err) {
      console.error(`[stories-publish] ${item.id} failed:`, err);
      item.status = "failed";
      item.error = err instanceof Error ? err.message : String(err);
    }
    // uložit hned po každé změně — okno pro double-publish při pádu KV se zmenší na jednu položku
    await saveQueue(queue);
  }

  // údržba tokenu — best effort
  try {
    await refreshTokenIfNeeded();
  } catch (err) {
    console.error("[stories-publish] token refresh failed:", err);
  }

  return NextResponse.json({ ok: true, published });
}
