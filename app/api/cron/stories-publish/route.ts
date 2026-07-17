import { NextRequest, NextResponse } from "next/server";
import { getQueue, saveQueue } from "@/modules/stories/lib/store";
import { publishStory, refreshTokenIfNeeded } from "@/modules/stories/lib/instagram";
import type { QueueItem } from "@/modules/stories/lib/types";

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
  const results: QueueItem[] = [];

  for (const item of queue) {
    if (item.status !== "queued" || new Date(item.publishAt) > now) {
      results.push(item);
      continue;
    }
    try {
      await publishStory(videoUrl(item.videoPublicId));
      results.push({ ...item, status: "published", error: undefined });
    } catch (err) {
      console.error(`[stories-publish] ${item.id} failed:`, err);
      results.push({ ...item, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }
  await saveQueue(results);

  // údržba tokenu — best effort
  try {
    await refreshTokenIfNeeded();
  } catch (err) {
    console.error("[stories-publish] token refresh failed:", err);
  }

  const published = results.filter((r, i) => r.status === "published" && queue[i]?.status === "queued").length;
  return NextResponse.json({ ok: true, published });
}
