"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { EditorialImage, EditorialImages } from "@/modules/admin/lib/content";
import { AdminPreview, SPLIT_LAYOUT, type PreviewFocus } from "@/modules/admin/preview/AdminPreview";
import type { PreviewPage } from "@/modules/admin/preview/protocol";
import { FocalPicker } from "./FocalPicker";

type Slot = {
  label: string;
  read: (data: EditorialImages) => EditorialImage;
  write: (data: EditorialImages, image: EditorialImage) => void;
  index?: number;
  group?: (data: EditorialImages) => EditorialImage[];
};

const single = (label: string, read: Slot["read"], write: Slot["write"]): Slot => ({ label, read, write });
const list = (
  label: string,
  data: EditorialImages,
  read: (value: EditorialImages) => EditorialImage[],
): Slot[] => read(data).map((_, index) => ({
  ...single(
    `${label} ${index + 1}`,
    (value) => read(value)[index],
    (value, image) => { read(value)[index] = image; },
  ),
  index,
  group: read,
}));

function imageSlots(data: EditorialImages): Slot[] {
  return [
    single("Homepage — hero", (v) => v.home.hero, (v, image) => { v.home.hero = image; }),
    ...list("Homepage — příběh", data, (v) => v.home.stories),
    single("Homepage — fotograf", (v) => v.home.photographer, (v, image) => { v.home.photographer = image; }),
    single("Homepage — Focení 101", (v) => v.home.tools.foceni101, (v, image) => { v.home.tools.foceni101 = image; }),
    single("Homepage — plánovač světla", (v) => v.home.tools.lightPlanner, (v, image) => { v.home.tools.lightPlanner = image; }),
    single("Portréty — hero", (v) => v.portrait.hero, (v, image) => { v.portrait.hero = image; }),
    ...list("Portréty — galerie", data, (v) => v.portrait.gallery),
    single("Business — hero", (v) => v.business.hero, (v, image) => { v.business.hero = image; }),
    ...list("Business — headshot", data, (v) => v.business.headshots),
    single("Eventy — hero", (v) => v.events.hero, (v, image) => { v.events.hero = image; }),
    ...list("Eventy — reportáž", data, (v) => v.events.reportage),
  ];
}

// Where each slot lives on the site (first matching label prefix wins).
const TARGETS: [prefix: string, page: PreviewPage, selector: string][] = [
  ["Homepage — hero", "home", ".ed-home-hero"],
  ["Homepage — příběh", "home", ".ed-home-work"],
  ["Homepage — fotograf", "home", ".ed-home-about"],
  ["Homepage —", "home", ".ed-home-tools"],
  ["Portréty — hero", "portrety", ".ed-portrait-hero"],
  ["Portréty —", "portrety", ".ed-portrait-gallery"],
  ["Business — hero", "business", ".ed-business-hero"],
  ["Business —", "business", ".ed-business-headshots"],
  ["Eventy — hero", "eventy", ".ed-events-hero"],
  ["Eventy — reportáž 4", "eventy", ".ed-events-wide"],
  ["Eventy —", "eventy", ".ed-events-strip"],
];
const targetOf = (label: string) => TARGETS.find(([prefix]) => label.startsWith(prefix))!;

export function EditorialImageEditor({ editorial, photos }: { editorial: EditorialImages; photos: GalleryPhoto[] }) {
  const [data, setData] = useState(editorial);
  const [active, setActive] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState<PreviewPage>("home");
  const [locale, setLocale] = useState<"cs" | "en">("cs");
  const [focus, setFocus] = useState<PreviewFocus | null>(null);
  const slots = imageSlots(data);

  function select(slot: Slot) {
    if (selected === slot.label) return;
    const [, slotPage, selector] = targetOf(slot.label);
    setSelected(slot.label);
    setPage(slotPage);
    setFocus({ selector });
  }

  function update(slot: Slot, image: EditorialImage) {
    setData((current) => {
      const next = structuredClone(current);
      slot.write(next, image);
      return next;
    });
  }

  function move(slot: Slot, offset: -1 | 1) {
    if (slot.index === undefined || !slot.group) return;
    setData((current) => {
      const next = structuredClone(current);
      const images = slot.group!(next);
      const target = slot.index! + offset;
      if (target < 0 || target >= images.length) return current;
      [images[slot.index!], images[target]] = [images[target], images[slot.index!]];
      return next;
    });
  }

  async function save() {
    setStatus("saving");
    try {
      const response = await fetch("/api/admin/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editorial: data }),
      });
      setStatus(response.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return <section>
    <h2 className="text-lg font-semibold mb-1">Editorialové fotky</h2>
    <p className="text-xs text-gray-500 mb-4">Fotku, popis a ořez můžeš změnit pro každý blok redesignu.</p>
    <div className={SPLIT_LAYOUT}>
    <div>
    <div className="grid gap-3 sm:grid-cols-2">
      {slots.map((slot) => {
        const image = slot.read(data);
        return <article key={slot.label} onFocusCapture={() => select(slot)} onPointerDownCapture={() => select(slot)}
          className={`border p-3 space-y-3 transition-colors ${selected === slot.label ? "border-amber-400/70" : "border-white/10"}`}>
          <h3 className="text-sm font-medium">{slot.label}</h3>
          {image.publicId
            ? <FocalPicker publicId={image.publicId} label={slot.label} focal={image.focal} onChange={(focal) => update(slot, { ...image, focal })} />
            : <div className="aspect-[4/3] bg-zinc-900" />}
          <button type="button" onClick={() => setActive(active === slot.label ? null : slot.label)} aria-label={`Změnit fotku: ${slot.label}`} className="text-xs underline underline-offset-4">
            {image.publicId ? "Změnit fotku" : "Vybrat fotku"}
          </button>
          <div className="flex gap-3 text-xs">
            <button type="button" aria-label={`Vyprázdnit slot: ${slot.label}`} onClick={() => update(slot, { publicId: "", alt: { cs: "", en: "" }, focal: { desktop: "50% 50%", mobile: "50% 50%" } })} disabled={!image.publicId} className="disabled:opacity-30">Vyprázdnit</button>
            {slot.index !== undefined && slot.group && <>
              <button type="button" aria-label={`Posunout nahoru: ${slot.label}`} onClick={() => move(slot, -1)} disabled={slot.index === 0} className="disabled:opacity-30">↑</button>
              <button type="button" aria-label={`Posunout dolů: ${slot.label}`} onClick={() => move(slot, 1)} disabled={slot.index === slot.group(data).length - 1} className="disabled:opacity-30">↓</button>
            </>}
          </div>
          {active === slot.label && <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {photos.map((photo) => <button key={photo.publicId} type="button" aria-label={`Vybrat ${photo.alt.cs || photo.publicId}`} onClick={() => {
              update(slot, { ...image, publicId: photo.publicId, alt: photo.alt });
              setActive(null);
            }}>
              <img src={cloudinaryUrl(photo.publicId, "w_120,h_120,c_fill,q_auto,f_auto")} alt="" className="aspect-square object-cover" />
            </button>)}
          </div>}
          <input aria-label={`${slot.label} alt CZ`} value={image.alt.cs} onChange={(event) => update(slot, { ...image, alt: { ...image.alt, cs: event.target.value } })} placeholder="Alt text CZ" className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs" />
          <input aria-label={`${slot.label} alt EN`} value={image.alt.en} onChange={(event) => update(slot, { ...image, alt: { ...image.alt, en: event.target.value } })} placeholder="Alt text EN" className="w-full bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs" />
        </article>;
      })}
    </div>
    <div className="sticky bottom-0 z-10 mt-4 flex items-center gap-3 bg-black/90 py-3 backdrop-blur">
      <button type="button" onClick={save} disabled={status === "saving"} className="px-4 py-2 bg-white text-black text-sm font-medium disabled:opacity-50">Uložit editorialové fotky</button>
      <span aria-live="polite" className={`text-sm ${status === "error" ? "text-red-400" : "text-green-400"}`}>
        {status === "ok" ? "Uloženo" : status === "error" ? "Uložení selhalo" : ""}
      </span>
    </div>
    </div>
    <AdminPreview page={page} onPageChange={setPage} locale={locale} onLocaleChange={setLocale} editorial={data} focus={focus} />
    </div>
  </section>;
}
