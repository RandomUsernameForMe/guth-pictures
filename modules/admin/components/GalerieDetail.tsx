"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type GalleryRecord, type GalleryPhoto, type GallerySelection } from "@/modules/gallery/lib/gallery";
import {
  selectedFilenames,
  formatFilenamesForCopy,
  formatFilenamesForTxt,
} from "@/modules/gallery/lib/selection-export";

interface Props {
  gallery: GalleryRecord;
  photos: GalleryPhoto[];
  selection: GallerySelection | null;
}

function watermarkedUrl(cloudinaryId: string, cloudName: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/l_text:Arial_32_bold:PREVIEW,co_white,o_50,g_center/c_fit,w_600/${cloudinaryId}.jpg`;
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function GalerieDetail({ gallery, photos, selection: initialSelection }: Props) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [tagging, setTagging] = useState(false);
  const [tagResult, setTagResult] = useState<string | null>(null);
  const [copyResult, setCopyResult] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selection] = useState(initialSelection);

  const expired = new Date() > new Date(gallery.expiresAt);
  const galleryUrl = `/gallery/${gallery.slug}`;

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/admin/gallery/${gallery.slug}/sync`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSyncResult(
        `Synchronizováno: ${data.synced} fotek${data.failed ? `, ${data.failed} selhalo` : ""}${data.errors?.length ? `\n${data.errors.join("\n")}` : ""}`
      );
      router.refresh();
    } catch (e) {
      setSyncResult(`Chyba: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleTag() {
    setTagging(true);
    setTagResult(null);
    try {
      const res = await fetch(`/api/admin/gallery/${gallery.slug}/tag`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTagResult(
        `Označeno v Lightroomu: ${data.tagged} fotek${data.failed ? `, ${data.failed} selhalo` : ""}`
      );
    } catch (e) {
      setTagResult(`Chyba: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setTagging(false);
    }
  }

  async function handleCopyFilenames() {
    if (!selection) return;
    try {
      await navigator.clipboard.writeText(formatFilenamesForCopy(photos, selection.favorites));
      setCopyResult(`Zkopírováno ${selectedFilenames(photos, selection.favorites).length} názvů`);
    } catch (e) {
      setCopyResult(`Chyba: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  }

  function handleDownloadTxt() {
    if (!selection) return;
    const blob = new Blob([formatFilenamesForTxt(photos, selection.favorites)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${gallery.slug}-vyber.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm(`Smazat galerii "${gallery.slug}"? Tato akce je nevratná.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/gallery/${gallery.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/galerie");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">{gallery.slug}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {expired ? (
              <span className="text-red-400">Expirováno</span>
            ) : (
              <>Aktivní · vyprší {new Date(gallery.expiresAt).toLocaleDateString("cs-CZ")}</>
            )}
            {gallery.syncedAt && (
              <> · sync {new Date(gallery.syncedAt).toLocaleDateString("cs-CZ")}</>
            )}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 hover:border-red-400 transition-colors disabled:opacity-40"
        >
          {deleting ? "Mažu…" : "Smazat"}
        </button>
      </div>

      {/* Info + actions */}
      <div className="border border-white/10 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Odkaz pro klienta</p>
            <a
              href={galleryUrl}
              target="_blank"
              rel="noopener"
              className="text-white hover:underline break-all"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}{galleryUrl}
            </a>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Fotky</p>
            <p>{gallery.photoCount} synchronizováno</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 disabled:opacity-40 transition-colors"
          >
            {syncing ? "Synchronizuji…" : "↻ Sync z Lightroomu"}
          </button>

          {selection?.favorites.length ? (
            <button
              onClick={handleTag}
              disabled={tagging}
              className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 disabled:opacity-40 transition-colors"
            >
              {tagging
                ? "Označuji…"
                : `★ Označit v Lightroomu (${selection.favorites.length})`}
            </button>
          ) : null}
        </div>

        {syncResult && (
          <p className={`text-sm ${syncResult.startsWith("Chyba") ? "text-red-400" : "text-green-400"}`}>
            {syncResult}
          </p>
        )}
        {tagResult && (
          <p className={`text-sm ${tagResult.startsWith("Chyba") ? "text-red-400" : "text-green-400"}`}>
            {tagResult}
          </p>
        )}
      </div>

      {/* Client selection */}
      {selection ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">
              Výběr klienta ({selection.favorites.length} fotek)
            </h2>
            <p className="text-xs text-gray-500">
              Naposledy upraveno {new Date(selection.lastUpdated).toLocaleString("cs-CZ")}
            </p>
          </div>
          {selection.note && (
            <div className="border border-white/10 p-4">
              <p className="text-xs text-gray-500 mb-1">Poznámka klienta</p>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{selection.note}</p>
            </div>
          )}
          {selection.favorites.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleCopyFilenames}
                className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 transition-colors"
              >
                Zkopírovat názvy souborů
              </button>
              <button
                onClick={handleDownloadTxt}
                className="text-sm border border-white/20 px-4 py-2 hover:border-white/60 transition-colors"
              >
                Stáhnout .txt
              </button>
              {copyResult && (
                <p className={`text-sm ${copyResult.startsWith("Chyba") ? "text-red-400" : "text-green-400"}`}>
                  {copyResult}
                </p>
              )}
            </div>
          )}
          {selection.favorites.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos
                .filter((p) => selection.favorites.includes(p.lrId))
                .map((photo) => (
                  <div key={photo.lrId} className="relative aspect-square bg-zinc-900 overflow-hidden">
                    <Image
                      src={watermarkedUrl(photo.cloudinaryId, CLOUD)}
                      alt={photo.filename}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                    <div className="absolute inset-0 ring-2 ring-white/80 pointer-events-none" />
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Klient zatím nic nevybral.</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Klient ještě neodeslal výběr.</p>
      )}

      {/* All photos preview */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-medium">Všechny fotky ({photos.length})</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
            {photos.map((photo) => {
              const isFav = selection?.favorites.includes(photo.lrId);
              return (
                <div
                  key={photo.lrId}
                  className={`relative aspect-square bg-zinc-900 overflow-hidden ${
                    isFav ? "ring-2 ring-white" : ""
                  }`}
                >
                  <Image
                    src={watermarkedUrl(photo.cloudinaryId, CLOUD)}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
