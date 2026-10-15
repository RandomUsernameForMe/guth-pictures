"use client";

import { useState } from "react";
import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";
import type { EditorialImages } from "@/modules/admin/lib/content";
import { EditorialImageEditor } from "./EditorialImageEditor";
import { PhotoUploadSection } from "./PhotoUploadSection";
import { HeroTriptychEditor, PANEL_LABELS, type Triptych, type Slot } from "./HeroTriptychEditor";

type Props = {
  photos: GalleryPhoto[];
  heroTriptych?: Triptych;
  editorial?: EditorialImages;
};

export function AdminDashboard({ photos: initial, heroTriptych: initialTriptych, editorial }: Props) {
  const [photos, setPhotos] = useState(initial);
  const [triptych, setTriptych] = useState<Triptych>(initialTriptych ?? [[], [], []]);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function handleDelete(publicId: string) {
    if (!confirm("Smazat fotku?")) return;
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPhotoError(data?.error ?? "Smazání se nezdařilo.");
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
    } catch {
      setPhotoError("Smazání se nezdařilo.");
    }
  }

  async function handleToggleSelected(publicId: string, current: boolean) {
    const next = !current;
    setPhotos((prev) =>
      prev.map((p) => (p.publicId === publicId ? { ...p, selected: next } : p))
    );
    try {
      const res = await fetch("/api/admin/toggle-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId, selected: next }),
      });
      if (!res.ok) throw new Error();
      await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => {});
    } catch {
      // Rollback
      setPhotos((prev) =>
        prev.map((p) => (p.publicId === publicId ? { ...p, selected: current } : p))
      );
      setPhotoError("Změna selected se nezdařila.");
    }
  }

  function handlePhotoClick(publicId: string) {
    if (activeSlot === null) return;
    const next = triptych.map((arr) => [...arr]) as Triptych;
    const idx = next[activeSlot].indexOf(publicId);
    if (idx !== -1) {
      next[activeSlot].splice(idx, 1);
    } else {
      next[activeSlot].push(publicId);
    }
    setTriptych(next);
  }

  return (
    <div className="space-y-12">
      {editorial && <EditorialImageEditor editorial={editorial} photos={photos} />}
      <HeroTriptychEditor
        triptych={triptych}
        setTriptych={setTriptych}
        activeSlot={activeSlot}
        setActiveSlot={setActiveSlot}
      />
      <PhotoUploadSection />

      {/* Photo list */}
      <section>
        <h2 className="text-lg font-semibold mb-1">
          Fotky ({photos.length})
        </h2>
        <p className="text-xs text-gray-500 mb-1">
          ★ = podklad pro automatické návrhy stories ({photos.filter(p => p.selected).length} označeno)
        </p>
        {activeSlot !== null && (
          <p className="text-xs text-blue-400 mb-3">
            Klikni na fotku pro přiřazení do {PANEL_LABELS[activeSlot]} — nebo klikni slot znovu pro zrušení
          </p>
        )}
        {photoError && (
          <p className="text-sm text-red-400 mb-3">{photoError}</p>
        )}
        {photos.length === 0 ? (
          <p className="text-gray-500">Žádné fotky</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => {
              const inSlots = ([0, 1, 2] as const).filter((s) => triptych[s].includes(photo.publicId));
              return (
              <div
                key={photo.publicId}
                className={`relative group ${activeSlot !== null ? "cursor-pointer" : ""}`}
                onClick={() => handlePhotoClick(photo.publicId)}
              >
                <Image
                  src={cloudinaryUrl(photo.publicId, "w_400,c_fill")}
                  alt={photo.alt.cs}
                  width={400}
                  height={300}
                  sizes="(max-width: 640px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={blurUrl(photo.publicId)}
                  className="w-full aspect-[4/3] object-cover"
                />
                {/* Selected indicator */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleSelected(photo.publicId, photo.selected ?? false); }}
                  title={photo.selected ? "Odebrat z Selected Work" : "Přidat do Selected Work"}
                  className={`absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center rounded-full text-sm transition-colors ${
                    photo.selected
                      ? "bg-yellow-400 text-black"
                      : "bg-black/50 text-white/30 hover:text-white/80"
                  }`}
                >
                  ★
                </button>
                {/* Triptych slot badge */}
                {inSlots.length > 0 && (
                  <span className="absolute top-2 right-2 z-10 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {inSlots.map((s) => `P${s + 1}`).join(" ")}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <span className="text-xs text-gray-300 text-center truncate w-full px-1">
                    {photo.alt.cs || photo.publicId}
                  </span>
                  <span className="text-xs text-gray-500">{photo.category}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.publicId); }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Smazat
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
