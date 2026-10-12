"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "../lib/gallery";
import { filterPhotos, selectionLabel } from "../lib/selection-filter";
import { watermarkedUrl } from "../lib/watermarked-url";
import { useGallerySelection } from "../hooks/useGallerySelection";
import { PasswordGate } from "./PasswordGate";
import { HeartIcon } from "./HeartIcon";
import { SaveSelectionButton } from "./SaveSelectionButton";
import { ClientLightbox } from "./ClientLightbox";

const NOTE_MAX_LENGTH = 1000;

function PhotoTile({
  photo,
  isFav,
  disabled,
  onOpen,
  onToggle,
}: {
  photo: GalleryPhoto;
  isFav: boolean;
  disabled: boolean;
  onOpen: (photo: GalleryPhoto) => void;
  onToggle: (lrId: string) => void;
}) {
  return (
    <div className="relative group aspect-square bg-zinc-900 overflow-hidden">
      <button
        onClick={() => onOpen(photo)}
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
          onToggle(photo.lrId);
        }}
        aria-label={isFav ? "Odebrat z výběru" : "Přidat do výběru"}
        disabled={disabled}
        className={`absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center transition-all ${
          isFav
            ? "text-white opacity-100"
            : "text-white/40 opacity-0 group-hover:opacity-100"
        }`}
      >
        <HeartIcon filled={isFav} className="w-5 h-5" />
      </button>
      {/* Favorite indicator overlay */}
      {isFav && <div className="absolute inset-0 ring-2 ring-white/60 pointer-events-none" />}
    </div>
  );
}

function FavoritesToggle({
  onlyFavorites,
  count,
  onChange,
}: {
  onlyFavorites: boolean;
  count: number;
  onChange: (only: boolean) => void;
}) {
  return (
    <div className="flex border border-zinc-700 text-sm">
      <button
        onClick={() => onChange(false)}
        aria-pressed={!onlyFavorites}
        className={`px-4 py-2 transition-colors ${
          !onlyFavorites ? "bg-white text-black" : "bg-zinc-900 text-gray-300 hover:bg-zinc-800"
        }`}
      >
        Vše
      </button>
      <button
        onClick={() => onChange(true)}
        aria-pressed={onlyFavorites}
        className={`px-4 py-2 transition-colors ${
          onlyFavorites ? "bg-white text-black" : "bg-zinc-900 text-gray-300 hover:bg-zinc-800"
        }`}
      >
        Vybrané ({count})
      </button>
    </div>
  );
}

function ConfirmSelectionButton({
  disabled,
  confirming,
  onClick,
  className,
}: {
  disabled: boolean;
  confirming: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} border border-white/40 text-white text-sm font-medium hover:bg-white/10 disabled:opacity-40 transition-colors`}
    >
      {confirming ? "Potvrzuji…" : "Potvrdit výběr"}
    </button>
  );
}

function ClientPhotoGrid({
  slug,
  photos,
  maxSelection,
}: {
  slug: string;
  photos: GalleryPhoto[];
  maxSelection: number | null;
}) {
  const { favorites, note, setNote, toggle, save, saving, saved, error, confirmedAt, confirming, confirmSelection } =
    useGallerySelection(slug, maxSelection);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const visible = filterPhotos(photos, favorites, onlyFavorites);
  const locked = confirmedAt !== null;
  const limitReached = locked || (maxSelection !== null && favorites.size >= maxSelection);

  function handleConfirm() {
    if (!confirm("Potvrdit finální výběr? Poté ho už nepůjde změnit.")) return;
    confirmSelection();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vaše galerie</h1>
          <p className="text-sm text-gray-400 mt-1">
            {photos.length} fotek · {maxSelection !== null ? `${favorites.size} / ${maxSelection}` : favorites.size} vybráno
          </p>
        </div>
        <FavoritesToggle onlyFavorites={onlyFavorites} count={favorites.size} onChange={setOnlyFavorites} />
        {!locked && (
          <>
            <SaveSelectionButton
              saving={saving}
              saved={saved}
              onClick={save}
              savingLabel="Ukládám…"
              className="px-6 py-2"
            />
            <ConfirmSelectionButton
              disabled={confirming || saving || favorites.size === 0}
              confirming={confirming}
              onClick={handleConfirm}
              className="px-6 py-2"
            />
          </>
        )}
      </div>

      {confirmedAt && (
        <p role="status" className="text-sm text-green-400 border border-green-500/30 px-4 py-2">
          Výběr potvrzen dne {new Date(confirmedAt).toLocaleDateString("cs-CZ")}
        </p>
      )}

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
        {visible.map((photo) => (
          <PhotoTile
            key={photo.lrId}
            photo={photo}
            isFav={favorites.has(photo.lrId)}
            disabled={!favorites.has(photo.lrId) && limitReached}
            onOpen={setLightbox}
            onToggle={toggle}
          />
        ))}
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
          disabled={locked}
          onChange={(e) => setNote(e.target.value)}
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
            {maxSelection !== null ? `${favorites.size} / ${maxSelection}` : favorites.size}{" "}
            {selectionLabel(favorites.size)}
          </span>
          {error && (
            <p role="alert" className="text-red-400 text-sm">
              {error}
            </p>
          )}
          {!locked && (
            <>
              <SaveSelectionButton
                saving={saving}
                saved={saved}
                onClick={save}
                savingLabel="…"
                className="px-4 py-1.5"
              />
              <ConfirmSelectionButton
                disabled={confirming || saving || favorites.size === 0}
                confirming={confirming}
                onClick={handleConfirm}
                className="px-4 py-1.5"
              />
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <ClientLightbox
          photo={lightbox}
          photos={visible}
          isFav={favorites.has(lightbox.lrId)}
          disabled={!favorites.has(lightbox.lrId) && limitReached}
          onToggle={toggle}
          onChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export function GalleryClient({ slug }: { slug: string }) {
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [maxSelection, setMaxSelection] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");

  async function loadPhotos() {
    try {
      const res = await fetch(`/api/gallery/${slug}/photos`);
      if (res.status === 401) return; // still need password
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMaxSelection(data.maxSelection ?? null);
        setPhotos(data.photos);
      }
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
    return <ClientPhotoGrid slug={slug} photos={photos} maxSelection={maxSelection} />;
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
