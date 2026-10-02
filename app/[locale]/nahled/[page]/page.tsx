import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getContent, getImages } from "@/modules/admin/lib/content";
import { PreviewSurface } from "@/modules/admin/preview/PreviewSurface";
import { isPreviewPage } from "@/modules/admin/preview/protocol";

// Admin-only live preview (auth enforced in middleware); renders draft data sent from the admin via postMessage.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ locale: string; page: string }> }) {
  const { locale, page } = await params;
  if (!isPreviewPage(page)) notFound();
  setRequestLocale(locale);
  const [content, images] = await Promise.all([getContent(locale), getImages()]);
  return <PreviewSurface page={page} locale={locale} content={content} images={images} />;
}
