"use client";

import { useState } from "react";
import Image from "next/image";
import { type GalleryPhoto, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

const CATEGORIES = ["portréty", "svatby", "larpy"] as const;

type Props = { photos: GalleryPhoto[] };

export function AdminDashboard({ photos: initial }: Props) {
  const [photos, setPhotos] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    setUploadError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    const res = await fetch("/api/admin/upload", { method: "POST", body: data });

    if (res.ok) {
      form.reset();
      window.location.reload();
    } else {
      setUploadError("Upload selhal");
      setUploading(false);
    }
  }

  async function handleDelete(publicId: string) {
    if (!confirm("Smazat fotku?")) return;

    await fetch("/api/admin/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });

    setPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
  }

  return (
    <div className="space-y-12">
      {/* Upload */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Nahrát fotku</h2>
        <form onSubmit={handleUpload} className="space-y-3 max-w-md">
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-zinc-800 file:text-white file:cursor-pointer"
          />
          <select
            name="category"
            className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            name="alt_cs"
            placeholder="Alt text (CZ)"
            className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 text-sm focus:outline-none focus:border-white"
          />
          <input
            type="text"
            name="alt_en"
            placeholder="Alt text (EN)"
            className="w-full bg-zinc-900 border border-zinc-700 px-4 py-2 text-sm focus:outline-none focus:border-white"
          />
          {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {uploading ? "Nahrávám…" : "Nahrát"}
          </button>
        </form>
      </section>

      {/* Photo list */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          Fotky ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <p className="text-gray-500">Žádné fotky</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.publicId} className="relative group">
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
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  <span className="text-xs text-gray-300 text-center truncate w-full px-1">
                    {photo.alt.cs || photo.publicId}
                  </span>
                  <span className="text-xs text-gray-500">{photo.category}</span>
                  <button
                    onClick={() => handleDelete(photo.publicId)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Smazat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
