"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type GalleryPhoto, CATEGORIES, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 20;

type FileStatus = "pending" | "uploading" | "done" | "error";
type FileItem = { file: File; preview: string; status: FileStatus };

type Props = { photos: GalleryPhoto[] };

export function AdminDashboard({ photos: initial }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [altCs, setAltCs] = useState("");
  const [altEn, setAltEn] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileItemsRef = useRef<FileItem[]>([]);
  useEffect(() => { fileItemsRef.current = fileItems; }, [fileItems]);
  useEffect(() => {
    return () => { fileItemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview)); };
  }, []);

  function addFiles(files: FileList | File[]) {
    const oversized: string[] = [];
    const items: FileItem[] = Array.from(files)
      .filter((f) => {
        if (!ALLOWED_TYPES.includes(f.type)) return false;
        if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          oversized.push(f.name);
          return false;
        }
        return true;
      })
      .map((file) => ({ file, preview: URL.createObjectURL(file), status: "pending" }));
    if (oversized.length > 0) {
      setUploadError(`Tyto soubory překračují limit ${MAX_FILE_SIZE_MB} MB: ${oversized.join(", ")}`);
    }
    setFileItems((prev) => [...prev, ...items]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  async function handleUpload() {
    if (fileItems.length === 0 || progress !== null) return;
    setUploadError(null);
    const total = fileItems.length;
    setProgress({ current: 0, total });

    // Získat podpis pro celou dávku (stejné metadata)
    const sigRes = await fetch("/api/admin/upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altCs, altEn, category }),
    });

    if (!sigRes.ok) {
      fileItems.forEach((item) => URL.revokeObjectURL(item.preview));
      setFileItems((prev) => prev.map((item) => ({ ...item, status: "error" })));
      setUploadError(`Chyba při získání upload podpisu (${sigRes.status}). Zkontroluj Cloudinary credentials.`);
      setProgress(null);
      return;
    }

    const { signature, timestamp, apiKey, cloudName, folder, context } = await sigRes.json();

    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i];

      setFileItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "uploading" } : it))
      );

      const data = new FormData();
      data.append("file", item.file);
      data.append("api_key", apiKey);
      data.append("timestamp", String(timestamp));
      data.append("signature", signature);
      data.append("folder", folder);
      data.append("context", context);

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: data }
        );
        setFileItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: res.ok ? "done" : "error" } : it))
        );
      } catch {
        setFileItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "error" } : it))
        );
      }

      setProgress({ current: i + 1, total });
    }

    fileItems.forEach((item) => URL.revokeObjectURL(item.preview));
    await fetch("/api/admin/revalidate", { method: "POST" }).catch(() => {});
    setFileItems([]);
    setProgress(null);
    router.refresh();
  }

  async function handleDelete(publicId: string) {
    if (!confirm("Smazat fotku?")) return;
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      if (!res.ok) throw new Error();
      setPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
    } catch {
      setUploadError("Smazání se nezdařilo.");
    }
  }

  return (
    <div className="space-y-12">
      {/* Upload */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Nahrát fotky</h2>
        <div className="space-y-3 max-w-2xl">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded px-6 py-10 text-center cursor-pointer transition-colors ${
              dragOver ? "border-white bg-zinc-800" : "border-zinc-600 hover:border-zinc-400"
            }`}
          >
            <p className="text-sm text-gray-400">Přetáhni fotky sem nebo klikni pro výběr</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); }}
            />
          </div>

          {/* Batch settings */}
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={altCs}
              onChange={(e) => setAltCs(e.target.value)}
              placeholder="Alt text (CZ)"
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
            <input
              type="text"
              value={altEn}
              onChange={(e) => setAltEn(e.target.value)}
              placeholder="Alt text (EN)"
              className="flex-1 bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>

          {/* Thumbnail previews */}
          {fileItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {fileItems.map((item, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt="" className="w-full h-full object-cover rounded" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {item.status === "uploading" && (
                      <span className="text-xs bg-black/70 text-white px-1 rounded">…</span>
                    )}
                    {item.status === "done" && (
                      <span className="text-green-400 text-lg bg-black/50 rounded-full w-6 h-6 flex items-center justify-center">✓</span>
                    )}
                    {item.status === "error" && (
                      <span className="text-red-400 text-lg bg-black/50 rounded-full w-6 h-6 flex items-center justify-center">✗</span>
                    )}
                  </div>
                  <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/60 truncate px-1">
                    {item.file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Upload button + progress */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpload}
              disabled={fileItems.length === 0 || progress !== null}
              className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {fileItems.length > 0
                ? `Nahrát ${fileItems.length} ${fileItems.length === 1 ? "fotku" : fileItems.length < 5 ? "fotky" : "fotek"}`
                : "Nahrát"}
            </button>
            {progress && (
              <span className="text-sm text-gray-400">{progress.current} / {progress.total}</span>
            )}
          </div>
          {uploadError && (
            <p className="text-sm text-red-400">{uploadError}</p>
          )}
        </div>
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
