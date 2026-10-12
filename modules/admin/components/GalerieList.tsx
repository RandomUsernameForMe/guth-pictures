"use client";

import Link from "next/link";
import { useState } from "react";
import { type GalleryRecord, type GalleryListItem } from "@/modules/gallery/lib/gallery";
import { type LightroomAlbum } from "@/modules/gallery/lib/lightroom";

interface Props {
  galleries: GalleryListItem[];
  lrConnected: boolean;
  flashConnected?: boolean;
  flashError?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ");
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000);
}

function ExpiryBadge({ gallery }: { gallery: GalleryRecord }) {
  const days = daysUntil(gallery.expiresAt);
  if (days < 0 || days > 7) return null;
  return (
    <span className="text-xs px-2 py-0.5 border border-amber-500/40 text-amber-400">
      končí za {days} {days === 1 ? "den" : days >= 2 && days <= 4 ? "dny" : "dní"}
    </span>
  );
}

function StatusBadge({ gallery }: { gallery: GalleryRecord }) {
  const expired = new Date() > new Date(gallery.expiresAt);
  return (
    <span
      className={`text-xs px-2 py-0.5 border ${
        expired
          ? "border-red-500/40 text-red-400"
          : "border-green-500/40 text-green-400"
      }`}
    >
      {expired ? "Expirováno" : "Aktivní"}
    </span>
  );
}

function NewGalleryForm({
  onCreated,
}: {
  onCreated: (gallery: GalleryRecord) => void;
}) {
  const [albums, setAlbums] = useState<LightroomAlbum[] | null>(null);
  const [loadingAlbums, setLoadingAlbums] = useState(false);
  const [albumError, setAlbumError] = useState("");
  const [slug, setSlug] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [password, setPassword] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxSelection, setMaxSelection] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadAlbums() {
    setLoadingAlbums(true);
    setAlbumError("");
    try {
      const res = await fetch("/api/admin/lightroom/albums");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setAlbums(data.albums);
    } catch (e) {
      setAlbumError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoadingAlbums(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          albumId,
          password,
          expiryDays,
          ...(maxSelection !== "" && { maxSelection: Number(maxSelection) }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onCreated(data.gallery);
      setSlug("");
      setAlbumId("");
      setPassword("");
      setMaxSelection("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 p-6 space-y-4">
      <h2 className="text-lg font-medium">Nová galerie</h2>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">URL slug (jen písmena, čísla, pomlčky)</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
          placeholder="novakovi-svadba-2025"
          required
          className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
        />
        {slug && (
          <p className="text-xs text-gray-500">
            /gallery/{slug}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400">Lightroom album</label>
          {!albums && (
            <button
              type="button"
              onClick={loadAlbums}
              disabled={loadingAlbums}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              {loadingAlbums ? "Načítám…" : "Načíst alba"}
            </button>
          )}
        </div>
        {albumError && <p className="text-xs text-red-400">{albumError}</p>}
        {albums ? (
          <select
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
          >
            <option value="">— Vybrat album —</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={albumId}
            onChange={(e) => setAlbumId(e.target.value)}
            placeholder="Album ID (nebo načti seznam výše)"
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Heslo pro klienta</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="min 4 znaky"
            required
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-400">Platnost (dní)</label>
          <input
            type="number"
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            min={1}
            max={365}
            required
            className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-400">Max. vybraných fotek</label>
        <input
          type="number"
          value={maxSelection}
          onChange={(e) => setMaxSelection(e.target.value)}
          min={1}
          step={1}
          placeholder="bez limitu"
          className="w-full bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !slug || !albumId || !password}
        className="px-6 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
      >
        {submitting ? "Vytvářím…" : "Vytvořit galerii"}
      </button>
    </form>
  );
}

export function GalerieList({ galleries: initial, lrConnected, flashConnected, flashError }: Props) {
  const [galleries, setGalleries] = useState(initial);
  const [showForm, setShowForm] = useState(false);

  function handleCreated(g: GalleryRecord) {
    setGalleries((prev) => [{ ...g, selection: null }, ...prev]);
    setShowForm(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Klientské galerie</h1>
        <div className="flex items-center gap-4">
          {lrConnected ? (
            <span className="text-xs text-green-400 border border-green-500/30 px-2 py-1">
              Lightroom připojen
            </span>
          ) : (
            <a
              href="/api/admin/lightroom/connect"
              className="text-xs border border-white/20 px-3 py-1.5 hover:border-white/60 transition-colors"
            >
              Připojit Lightroom
            </a>
          )}
          {lrConnected && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="text-sm border border-white/20 px-4 py-1.5 hover:border-white/60 transition-colors"
            >
              {showForm ? "Zrušit" : "+ Nová galerie"}
            </button>
          )}
        </div>
      </div>

      {flashConnected && (
        <p className="text-green-400 text-sm border border-green-500/20 px-4 py-2">
          Lightroom úspěšně připojen.
        </p>
      )}
      {flashError && (
        <p className="text-red-400 text-sm border border-red-500/20 px-4 py-2">
          Chyba: {flashError}
        </p>
      )}

      {showForm && <NewGalleryForm onCreated={handleCreated} />}

      {galleries.length === 0 ? (
        <p className="text-gray-500 text-sm">Žádné galerie.</p>
      ) : (
        <div className="space-y-2">
          {galleries.map((g) => (
            <Link
              key={g.slug}
              href={`/admin/galerie/${g.slug}`}
              className="flex items-center justify-between px-4 py-3 border border-white/10 hover:border-white/30 transition-colors"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{g.slug}</p>
                <p className="text-xs text-gray-500">
                  {g.photoCount} fotek · vyprší {formatDate(g.expiresAt)}
                  {g.syncedAt && ` · sync ${formatDate(g.syncedAt)}`}
                </p>
                <p className="text-xs text-gray-500">
                  {g.selection
                    ? `${g.selection.count} vybrané · upraveno ${formatDate(g.selection.lastUpdated)}`
                    : "bez výběru"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {g.selection?.confirmedAt && (
                  <span className="text-xs px-2 py-0.5 border border-sky-500/40 text-sky-400">
                    potvrzeno
                  </span>
                )}
                <ExpiryBadge gallery={g} />
                <StatusBadge gallery={g} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
