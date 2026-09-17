"use client";

import { useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { StoryDraft } from "../lib/types";
import { TemplateC } from "./story/TemplateC";
import { TemplateD } from "./story/TemplateD";
import { useExport } from "./story/useExport";
import type { Photo } from "./story/types";

const W = 1080;
const H = 1920;
const PREVIEW_SCALE = 420 / H;
const MAX_PHOTOS = 10;

export function DraftCard({ draft, galleryPhotos, onChanged }: {
  draft: StoryDraft;
  galleryPhotos: GalleryPhoto[];
  onChanged: () => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [publishAt, setPublishAt] = useState("");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportTick, setExportTick] = useState<number | undefined>(undefined);
  const [exportLayer, setExportLayer] = useState<"photo" | "overlay" | "word" | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [chromePreview, setChromePreview] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerFor, setPickerFor] = useState<number | "add" | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportVideo } = useExport();

  const duration = d.durationMs ?? 2400;
  const lang = d.lang ?? "cs";

  const photos: Photo[] = d.photos.map(p => ({
    url: cloudinaryUrl(p.publicId, "w_1080,h_1920,c_fill,q_auto,f_jpg"),
    x: p.x, y: p.y,
  }));

  const slideCount = d.template === "C"
    ? Math.max(d.photos.length, 1)
    : Math.max(d.words.filter(Boolean).length, 1);

  const templateProps = { photos, duration, paused, lang, chrome: false, cta: d.cta ?? "" };
  const previewProps = { ...templateProps, chrome: chromePreview };

  function patch(p: Partial<StoryDraft>) { setD(prev => ({ ...prev, ...p })); }

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= d.photos.length) return;
    const photos = [...d.photos];
    [photos[i], photos[j]] = [photos[j], photos[i]];
    patch({ photos });
  }

  function pickPhoto(publicId: string) {
    if (pickerFor === "add") patch({ photos: [...d.photos, { publicId, x: 50, y: 50 }] });
    else if (typeof pickerFor === "number") patch({ photos: d.photos.map((pp, j) => j === pickerFor ? { ...pp, publicId } : pp) });
    setPickerFor(null);
  }

  async function save() {
    await fetch("/api/admin/stories/drafts", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: d }),
    });
    await onChanged();
  }

  async function remove() {
    await fetch(`/api/admin/stories/drafts?id=${d.id}`, { method: "DELETE" });
    await onChanged();
  }

  const onLayerReady = useCallback(async (slideIndex: number, layer: "photo" | "overlay" | "word") => {
    flushSync(() => { setExportTick(slideIndex); setExportLayer(layer); });
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }, []);

  const canRender = d.photos.length > 0 && !exporting && !(d.template === "D" && d.words.filter(Boolean).length === 0);

  async function renderVideo(): Promise<Blob> {
    try {
      return await exportVideo({
        element: exportRef.current!,
        width: W,
        height: H,
        slideCount,
        slideDurationMs: duration,
        hasWordLayer: d.template === "D",
        onProgress: setProgress,
        onLayerReady,
      });
    } finally {
      setExportTick(undefined);
      setExportLayer(undefined);
    }
  }

  async function downloadMp4() {
    if (!canRender) return;
    setExporting(true);
    try {
      const blob = await renderVideo();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `story-${d.id}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export selhal: ${err instanceof Error ? err.message : err}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  async function uploadFromDisk(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const uploadedIds: string[] = [];
      for (const file of Array.from(files).slice(0, MAX_PHOTOS - d.photos.length)) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", sig.apiKey);
        form.append("timestamp", String(sig.timestamp));
        form.append("signature", sig.signature);
        form.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: form },
        ).then(r => r.json());
        if (!res.public_id) throw new Error(res.error?.message ?? "Upload failed");
        uploadedIds.push(res.public_id);
      }
      patch({ photos: [...d.photos, ...uploadedIds.map(publicId => ({ publicId, x: 50, y: 50 }))] });
    } catch (err) {
      alert(`Nahrání selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function approve() {
    if (!publishAt || !canRender) return;
    setExporting(true);
    try {
      // 1. render videa v prohlížeči
      const blob = await renderVideo();

      // 2. signed direct upload do Cloudinary (video)
      const sig = await fetch("/api/admin/stories/upload-signature", { method: "POST" }).then(r => r.json());
      const form = new FormData();
      form.append("file", blob, `story-${d.id}.mp4`);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const uploaded = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`,
        { method: "POST", body: form },
      ).then(r => r.json());
      if (!uploaded.public_id) throw new Error(uploaded.error?.message ?? "Upload failed");

      // 3. přesun do fronty
      const res = await fetch("/api/admin/stories/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: d.id,
          videoPublicId: uploaded.public_id,
          publishAt: new Date(publishAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await onChanged();
    } catch (err) {
      alert(`Schválení selhalo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setExporting(false);
      setProgress(0);
      setExportTick(undefined);
    }
  }

  return (
    <div className="flex gap-6 border border-white/10 p-4">
      {/* preview */}
      <div className="shrink-0">
        <div className="relative overflow-hidden rounded-lg cursor-pointer"
          style={{ width: W * PREVIEW_SCALE, height: H * PREVIEW_SCALE }}
          onClick={() => setPaused(p => !p)} title="Kliknutím pauza/play">
          {d.template === "C"
            ? <TemplateC {...previewProps} headline={d.headline} sub={d.sub} scale={PREVIEW_SCALE} />
            : <TemplateD {...previewProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={PREVIEW_SCALE} />}
          {showSafeZone && (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 50 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 250 * PREVIEW_SCALE, background: "rgba(255,60,60,0.22)", borderBottom: "1px solid rgba(255,80,80,0.7)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 250 * PREVIEW_SCALE, background: "rgba(255,60,60,0.22)", borderTop: "1px solid rgba(255,80,80,0.7)" }} />
            </div>
          )}
        </div>
        <label className="flex items-center gap-1 mt-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showSafeZone} onChange={e => setShowSafeZone(e.target.checked)} />
          safe zone
        </label>
      </div>

      {/* editace */}
      <div className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <select value={d.template} onChange={e => patch({ template: e.target.value as "C" | "D" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="C">Šablona C</option>
            <option value="D">Šablona D</option>
          </select>
          <select value={lang} onChange={e => patch({ lang: e.target.value as "cs" | "en" })}
            className="bg-zinc-900 border border-white/20 px-2 py-1">
            <option value="cs">CZ</option>
            <option value="en">EN</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={chromePreview} onChange={e => setChromePreview(e.target.checked)} />
            IG chrome (náhled)
          </label>
          {d.textSource === "ai" && <span className="text-xs text-purple-400">AI text</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 whitespace-nowrap">Délka snímku · {duration} ms</span>
          <input type="range" min={800} max={5000} step={100} value={duration}
            onChange={e => patch({ durationMs: +e.target.value })} className="flex-1" />
        </div>

        {d.template === "C" ? (
          <>
            <textarea value={d.headline} onChange={e => patch({ headline: e.target.value })}
              placeholder="Headline" rows={2} className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.sub} onChange={e => patch({ sub: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        ) : (
          <>
            <input value={d.words.join(", ")} onChange={e => patch({ words: e.target.value.split(",").map(w => w.trim()) })}
              placeholder="Slova oddělená čárkou" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
            <input value={d.subHeadline} onChange={e => patch({ subHeadline: e.target.value })}
              placeholder="Podtitulek" className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />
          </>
        )}
        <input value={d.cta ?? ""} onChange={e => patch({ cta: e.target.value })}
          placeholder={lang === "cs" ? "Výzva (výchozí: Odepiš rovnou na tuhle story)" : "CTA (default: Reply to this story)"}
          className="w-full bg-zinc-900 border border-white/20 px-2 py-1" />

        {/* fotky: výměna + focal point */}
        <div className="space-y-2">
          {d.photos.map((p, i) => (
            <div key={`${p.publicId}-${i}`} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button className="text-xs text-gray-500 hover:text-white disabled:opacity-30 leading-none"
                  disabled={i === 0} title="Posunout výš" onClick={() => movePhoto(i, -1)}>↑</button>
                <button className="text-xs text-gray-500 hover:text-white disabled:opacity-30 leading-none"
                  disabled={i === d.photos.length - 1} title="Posunout níž" onClick={() => movePhoto(i, 1)}>↓</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cloudinaryUrl(p.publicId, "w_64,h_64,c_fill,q_auto,f_auto")} alt="" className="w-8 h-8 object-cover" />
              <button
                className="text-xs text-left flex-1 truncate border border-white/20 px-1 py-0.5 hover:border-white/50"
                title="Vybrat jinou fotku z portfolia"
                onClick={() => setPickerFor(pickerFor === i ? null : i)}>
                {p.publicId.split("/").pop()}
              </button>
              <label className="text-xs text-gray-500" title="Výřez vodorovně: 0 = levý okraj fotky, 100 = pravý">x</label>
              <input type="range" min={0} max={100} value={p.x} className="w-16"
                title="Výřez vodorovně: 0 = levý okraj fotky, 100 = pravý"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, x: +e.target.value } : pp) })} />
              <label className="text-xs text-gray-500" title="Výřez svisle: 0 = horní okraj fotky, 100 = dolní">y</label>
              <input type="range" min={0} max={100} value={p.y} className="w-16"
                title="Výřez svisle: 0 = horní okraj fotky, 100 = dolní"
                onChange={e => patch({ photos: d.photos.map((pp, j) => j === i ? { ...pp, y: +e.target.value } : pp) })} />
              <button className="text-xs text-gray-500 hover:text-red-400"
                onClick={() => patch({ photos: d.photos.filter((_, j) => j !== i) })}>✕</button>
            </div>
          ))}
          {d.photos.length < MAX_PHOTOS && (
            <div className="flex gap-2">
              <button className="text-xs border border-white/20 px-2 py-1"
                disabled={galleryPhotos.length === 0}
                onClick={() => setPickerFor(pickerFor === "add" ? null : "add")}>
                + z portfolia
              </button>
              <button className="text-xs border border-white/20 px-2 py-1"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Nahrávám…" : "+ z disku"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => uploadFromDisk(e.target.files)} />
            </div>
          )}
          {pickerFor !== null && (
            <div className="flex flex-wrap gap-1 border border-white/20 p-2 max-h-64 overflow-y-auto">
              {galleryPhotos.map(g => (
                <button key={g.publicId} title={g.publicId} onClick={() => pickPhoto(g.publicId)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cloudinaryUrl(g.publicId, "w_120,h_120,c_fill,q_auto,f_auto")} alt=""
                    className="w-16 h-16 object-cover hover:opacity-70" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* akce */}
        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
            className="bg-zinc-900 border border-white/20 px-2 py-1" />
          <button onClick={save} className="border border-white/20 px-3 py-1.5 hover:border-white/50">Uložit</button>
          <button onClick={downloadMp4} disabled={!canRender}
            className="border border-white/20 px-3 py-1.5 hover:border-white/50 disabled:opacity-30">
            ↓ MP4
          </button>
          <button onClick={approve} disabled={!publishAt || !canRender}
            className="bg-amber-500 text-black px-3 py-1.5 font-medium disabled:opacity-30">
            {exporting ? `Renderuji… ${Math.round(progress * 100)}%` : "Schválit + naplánovat"}
          </button>
          <button onClick={remove} className="text-gray-500 hover:text-red-400 ml-auto">Zamítnout</button>
        </div>
      </div>

      {/* skrytý full-res kontejner pro export */}
      <div ref={exportRef} style={{
        position: "fixed", top: "-9999px", left: "-9999px",
        width: W, height: H, pointerEvents: "none", overflow: "hidden",
      }}>
        {d.template === "C"
          ? <TemplateC {...templateProps} headline={d.headline} sub={d.sub} scale={1} exportTick={exportTick} exportLayer={exportLayer} />
          : <TemplateD {...templateProps} words={d.words.filter(Boolean)} subHeadline={d.subHeadline} scale={1} exportTick={exportTick} exportLayer={exportLayer} />}
      </div>
    </div>
  );
}
