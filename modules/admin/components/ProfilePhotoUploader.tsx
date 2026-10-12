"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl } from "@/lib/cloudinary-utils";
import type { SiteImages } from "@/modules/admin/lib/content";

export function ProfilePhotoUploader() {
  const router = useRouter();
  const [images, setImages] = useState<SiteImages>({ profile: "" });
  const [profileUploadStatus, setProfileUploadStatus] = useState<"idle" | "uploading" | "ok" | "error">("idle");
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/images")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((imgs) => { if (imgs) setImages(imgs); })
      .catch(() => {
        // fetch failed, state stays at empty default
      });
  }, [router]);

  async function handleProfileFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileUploadStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("upload failed");
      const { publicId } = await uploadRes.json();
      const newImages = { ...images, profile: publicId };
      const saveRes = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newImages),
      });
      if (!saveRes.ok) throw new Error("save failed");
      setImages(newImages);
      setProfileUploadStatus("ok");
      setTimeout(() => setProfileUploadStatus("idle"), 3000);
    } catch {
      setProfileUploadStatus("error");
    } finally {
      if (profileInputRef.current) profileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Obrázky webu</h2>
      <div className="border border-white/10 p-6 space-y-4 max-w-2xl">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Profilová fotka</h3>
        <div className="flex items-center gap-6">
          {images.profile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cloudinaryUrl(images.profile, "w_80,h_80,c_fill,g_face,q_auto,f_auto")}
              alt="Profilová fotka"
              className="w-20 h-20 object-cover"
            />
          )}
          <div className="flex items-center gap-4">
            <input
              ref={profileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleProfileFileChange}
            />
            <button
              type="button"
              disabled={profileUploadStatus === "uploading"}
              onClick={() => profileInputRef.current?.click()}
              className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {profileUploadStatus === "uploading" ? "Nahrávám…" : "Vybrat fotku"}
            </button>
            {profileUploadStatus === "ok" && <span className="text-green-400 text-sm">Uloženo</span>}
            {profileUploadStatus === "error" && <span className="text-red-400 text-sm">Chyba při nahrávání</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
