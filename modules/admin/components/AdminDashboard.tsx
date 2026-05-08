"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { type GalleryPhoto, CATEGORIES, cloudinaryUrl, blurUrl } from "@/lib/cloudinary-utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 100; // raw foťák fotky, komprese proběhne v prohlížeči

async function compressImage(file: File, maxPx = 4000, quality = 0.88): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

type FileStatus = "pending" | "compressing" | "uploading" | "done" | "error";
type FileItem = { file: File; preview: string; status: FileStatus };

type Props = {
  photos: GalleryPhoto[];
  heroTriptych?: [string, string, string];
};

const PANEL_LABELS = ["Panel 1 · Portréty", "Panel 2 · Eventy", "Panel 3 · Portréty"];

export function AdminDashboard({ photos: initial, heroTriptych: initialTriptych }: Props) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initial);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [altCs, setAltCs] = useState("");
  const [altEn, setAltEn] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [triptych, setTriptych] = useState<[string, string, string]>(
    initialTriptych ?? ["", "", ""]
  );
  const [activeSlot, setActiveSlot] = useState<0 | 1 | 2 | null>(null);
  const [triptychSaving, setTriptychSaving] = useState(false);
  const [triptychMsg, setTriptychMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileItemsRef = useRef<FileItem[]>([]);
  useEffect(() => { fileItemsRef.current = fileItems; }, [fileItems]);
  useEffect(() => {
    return () => { fileItemsRef.current.forEach((item) => URL.revokeObjectURL(item.preview)); };
  }, []);

  async function addFiles(files: FileList | File[]) {
    const valid = Array.from(files).filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setUploadError(`Soubor ${f.name} překračuje limit ${MAX_FILE_SIZE_MB} MB.`);
        return false;
      }
      return true;
    });

    // Přidej placeholdery ihned (ukazuje komprimaci)
    const placeholders: FileItem[] = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: "compressing",
    }));
    setFileItems((prev) => [...prev, ...placeholders]);

    // Komprimuj na pozadí a aktualizuj
    const compressed = await Promise.all(valid.map((f) => compressImage(f)));
    setFileItems((prev) => {
      const updated = [...prev];
      // nahraď placeholdery komprimovanými verzemi (podle pořadí přidání)
      let ci = 0;
      for (let i = updated.length - placeholders.length; i < updated.length; i++) {
        URL.revokeObjectURL(updated[i].preview);
        const preview = URL.createObjectURL(compressed[ci]);
        updated[i] = { file: compressed[ci], preview, status: "pending" };
        ci++;
      }
      return updated;
    });
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
      setUploadError("Změna selected se nezdařila.");
    }
  }

  async function handleSaveTriptych() {
    setTriptychSaving(true);
    setTriptychMsg(null);
    try {
      const current = await fetch("/api/admin/images").then((r) => r.json());
      const res = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero: current.hero ?? "", profile: current.profile ?? "", heroTriptych: triptych }),
      });
      setTriptychMsg(res.ok ? { ok: true, text: "Uloženo" } : { ok: false, text: "Chyba při ukládání" });
      if (res.ok) router.refresh();
    } catch {
      setTriptychMsg({ ok: false, text: "Chyba při ukládání" });
    }
    setTriptychSaving(false);
  }

  function handlePhotoClick(publicId: string) {
    if (activeSlot === null) return;
    const next = [...triptych] as [string, string, string];
    next[activeSlot] = publicId;
    setTriptych(next);
    const nextEmpty = ([0, 1, 2] as const).find((s) => s !== activeSlot && !next[s]);
    setActiveSlot(nextEmpty ?? null);
  }

  return (
    <div className="space-y-12">
      {/* Hero Triptych */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Hero triptych</h2>
        <p className="text-xs text-gray-500 mb-4">
          Klikni slot → klikni fotku níže. Aktivní slot = bílý rámeček.
        </p>
        <div className="flex gap-3 mb-4 max-w-lg">
          {([0, 1, 2] as const).map((slot) => {
            const pid = triptych[slot];
            return (
              <button
                key={slot}
                onClick={() => setActiveSlot(activeSlot === slot ? null : slot)}
                className={`relative flex-1 aspect-[3/4] border-2 overflow-hidden transition-colors ${
                  activeSlot === slot
                    ? "border-white"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                {pid ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cloudinaryUrl(pid, "w_300,c_fill,q_auto")}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
                    Prázdný
                  </span>
                )}
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-xs text-gray-400 text-left">
                  {PANEL_LABELS[slot]}
                </span>
                {pid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = [...triptych] as [string, string, string];
                      next[slot] = "";
                      setTriptych(next);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white text-xs flex items-center justify-center hover:bg-red-900 transition-colors"
                    title="Odebrat"
                  >
                    ×
                  </button>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTriptych}
            disabled={triptychSaving}
            className="px-4 py-2 bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {triptychSaving ? "Ukládám…" : "Uložit triptych"}
          </button>
          {triptychMsg && (
            <span className={`text-sm ${triptychMsg.ok ? "text-green-400" : "text-red-400"}`}>
              {triptychMsg.text}
            </span>
          )}
        </div>
      </section>

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
                    {item.status === "compressing" && (
                      <span className="text-xs bg-black/70 text-white px-1 rounded">↓</span>
                    )}
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
              disabled={fileItems.length === 0 || progress !== null || fileItems.some(f => f.status === "compressing")}
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
        <h2 className="text-lg font-semibold mb-1">
          Fotky ({photos.length})
        </h2>
        <p className="text-xs text-gray-500 mb-1">
          ★ = zobrazí se v sekci Selected Work na homepage ({photos.filter(p => p.selected).length} označeno)
        </p>
        {activeSlot !== null && (
          <p className="text-xs text-blue-400 mb-3">
            Klikni na fotku pro přiřazení do {PANEL_LABELS[activeSlot]} — nebo klikni slot znovu pro zrušení
          </p>
        )}
        {photos.length === 0 ? (
          <p className="text-gray-500">Žádné fotky</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => {
              const inTriptych = triptych.indexOf(photo.publicId);
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
                {inTriptych !== -1 && (
                  <span className="absolute top-2 right-2 z-10 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                    P{inTriptych + 1}
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
