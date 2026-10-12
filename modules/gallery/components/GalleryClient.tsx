"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { filterPhotos, stepPhoto, selectionLabel } from "../lib/selection-filter";

interface GalleryPhoto {
  lrId: string;
  cloudinaryId: string;
  filename: string;
  width: number;
  height: number;
}

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

const NOTE_MAX_LENGTH = 1000;

function watermarkedUrl(cloudinaryId: string, size = 800) {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/l_text:Arial_28_bold:PREVIEW,co_white,o_40,g_center/c_fit,w_${size}/${cloudinaryId}.jpg`;
}

function PasswordGate({
  slug,
  onSuccess,
}: {
  slug: string;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) {
        setError("Špatné heslo");
        return;
      }
      if (res.status === 410) {
        setError("Galerie vypršela");
        return;
      }
      if (res.status === 429) {
        setError("Příliš mnoho pokusů, zkuste to později");
        return;
      }
      if (!res.ok) {
        setError("Chyba serveru");
        return;
      }
      onSuccess();
    } catch {
      setError("Chyba sítě");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Vaše galerie</h1>
        <p className="text-sm text-gray-400">Zadejte heslo, které jste obdrželi od fotografa.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Heslo"
          autoFocus
          required
          className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm focus:outline-none focus:border-white"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {loading ? "…" : "Zobrazit galerii"}
        </button>
      </form>
    </div>
  );
}

function saveErrorMessage(status: number) {
  if (status === 410) return "Galerie vypršela, výběr nelze uložit";
  if (status === 401) return "Přihlášení vypršelo, načtěte stránku znovu";
  return "Výběr se nepodařilo uložit";
}

function PhotoGrid({
  slug,
  photos,
}: {
  slug: string;
  photos: GalleryPhoto[];
}) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;
  const [note, setNote] = useState("");
  const noteRef = useRef(note);
  noteRef.current = note;
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const visible = filterPhotos(photos, favorites, onlyFavorites);

  // Load existing selection
  useEffect(() => {
    fetch(`/api/gallery/${slug}/selection`)
      .then((r) => r.json())
      .then((data) => {
        if (data.selection?.favorites) {
          setFavorites(new Set(data.selection.favorites));
        }
        if (typeof data.selection?.note === "string") {
          setNote(data.selection.note);
        }
      })
      .catch(() => {});
  }, [slug]);

  function toggleFavorite(lrId: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(lrId)) next.delete(lrId);
      else next.add(lrId);
      return next;
    });
    setSaved(false);
  }

  async function handleSubmit() {
    const sent = Array.from(favorites);
    const sentNote = note;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/gallery/${slug}/selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: sent, note: sentNote }),
      });
      if (!res.ok) {
        setError(saveErrorMessage(res.status));
        return;
      }
      const current = favoritesRef.current;
      if (
        sentNote === noteRef.current &&
        sent.length === current.size &&
        sent.every((id) => current.has(id))
      ) {
        setSaved(true);
      }
    } catch {
      setError("Chyba sítě, zkuste to znovu");
    } finally {
      setSaving(false);
    }
  }

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (!lightbox) return;
      if (e.key === "ArrowRight") setLightbox(stepPhoto(visible, lightbox.lrId, 1));
      if (e.key === "ArrowLeft") setLightbox(stepPhoto(visible, lightbox.lrId, -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, visible, closeLightbox]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vaše galerie</h1>
          <p className="text-sm text-gray-400 mt-1">
            {photos.length} fotek · {favorites.size} vybráno
          </p>
        </div>
        <div className="flex border border-zinc-700 text-sm">
          <button
            onClick={() => setOnlyFavorites(false)}
            aria-pressed={!onlyFavorites}
            className={`px-4 py-2 transition-colors ${
              !onlyFavorites ? "bg-white text-black" : "bg-zinc-900 text-gray-300 hover:bg-zinc-800"
            }`}
          >
            Vše
          </button>
          <button
            onClick={() => setOnlyFavorites(true)}
            aria-pressed={onlyFavorites}
            className={`px-4 py-2 transition-colors ${
              onlyFavorites ? "bg-white text-black" : "bg-zinc-900 text-gray-300 hover:bg-zinc-800"
            }`}
          >
            Vybrané ({favorites.size})
          </button>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
        >
          {saving ? "Ukládám…" : saved ? "✓ Uloženo" : "Uložit výběr"}
        </button>
      </div>

      {favorites.size > 0 && (
        <p className="text-xs text-gray-500">
          Klikněte na fotku pro zvětšení · srdce pro výběr oblíbených
        </p>
      )}

      {/* Grid */}
      {onlyFavorites && visible.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">Zatím nemáte nic vybráno</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
        {visible.map((photo) => {
          const isFav = favorites.has(photo.lrId);
          return (
            <div key={photo.lrId} className="relative group aspect-square bg-zinc-900 overflow-hidden">
              <button
                onClick={() => setLightbox(photo)}
                className="w-full h-full"
                aria-label={`Zobrazit ${photo.filename}`}
              >
                <Image
                  src={watermarkedUrl(photo.cloudinaryId, 600)}
                  alt={photo.filename}
                  fill
                  className="object-cover transition-opacity group-hover:opacity-90"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </button>
              {/* Favorite toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(photo.lrId);
                }}
                aria-label={isFav ? "Odebrat z výběru" : "Přidat do výběru"}
                className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center transition-all ${
                  isFav
                    ? "text-white opacity-100"
                    : "text-white/40 opacity-0 group-hover:opacity-100"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill={isFav ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              {/* Favorite indicator overlay */}
              {isFav && (
                <div className="absolute inset-0 ring-2 ring-white/60 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label htmlFor="photographer-note" className="block text-sm text-gray-300 mb-2">
          Poznámka pro fotografa
        </label>
        <textarea
          id="photographer-note"
          value={note}
          maxLength={NOTE_MAX_LENGTH}
          rows={4}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="Např. přání k retuši nebo ořezu"
          className="w-full bg-zinc-900 border border-zinc-700 p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/60"
        />
        <p className="text-xs text-gray-500 text-right mt-1">
          {note.length} / {NOTE_MAX_LENGTH}
        </p>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-center">
        <div className="bg-zinc-900/90 backdrop-blur border border-white/10 px-6 py-3 flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {favorites.size} {selectionLabel(favorites.size)}
          </span>
          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 bg-white text-black text-sm font-medium hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            {saving ? "…" : saved ? "✓ Uloženo" : "Uložit výběr"}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
            onClick={closeLightbox}
            aria-label="Zavřít"
          >
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(stepPhoto(visible, lightbox.lrId, -1));
            }}
          >
            ‹
          </button>
          <div
            className="relative max-w-5xl max-h-screen w-full h-full p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={watermarkedUrl(lightbox.cloudinaryId, 2048)}
              alt={lightbox.filename}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(lightbox.lrId);
              }}
              className={`absolute bottom-20 right-20 w-12 h-12 flex items-center justify-center bg-black/60 border transition-colors ${
                favorites.has(lightbox.lrId)
                  ? "border-white text-white"
                  : "border-white/30 text-white/50 hover:border-white hover:text-white"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill={favorites.has(lightbox.lrId) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          </div>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(stepPhoto(visible, lightbox.lrId, 1));
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export function GalleryClient({ slug }: { slug: string }) {
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [loadError, setLoadError] = useState("");

  async function loadPhotos() {
    try {
      const res = await fetch(`/api/gallery/${slug}/photos`);
      if (res.status === 401) return; // still need password
      const data = await res.json().catch(() => ({}));
      if (res.ok) setPhotos(data.photos);
      else setLoadError(data.error ?? "Failed to load");
    } catch {
      setLoadError("Chyba sítě");
    }
  }

  // On mount, try to load photos (cookie might already be set from prior visit)
  useEffect(() => {
    loadPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-sm">{loadError}</p>
      </div>
    );
  }

  // Once we have photos, skip password gate
  if (photos !== null) {
    return <PhotoGrid slug={slug} photos={photos} />;
  }

  if (!authed) {
    return (
      <PasswordGate
        slug={slug}
        onSuccess={async () => {
          setAuthed(true);
          await loadPhotos();
        }}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-sm">Načítám…</p>
    </div>
  );
}
