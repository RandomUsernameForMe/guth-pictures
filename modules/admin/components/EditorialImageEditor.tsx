"use client";

import { useState } from "react";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { EditorialImage, EditorialImages } from "@/modules/admin/lib/content";

type Slot = {
  label: string;
  read: (data: EditorialImages) => EditorialImage;
  write: (data: EditorialImages, image: EditorialImage) => void;
};

const single = (label: string, read: Slot["read"], write: Slot["write"]): Slot => ({ label, read, write });
const list = (
  label: string,
  data: EditorialImages,
  read: (value: EditorialImages) => EditorialImage[],
): Slot[] => read(data).map((_, index) => single(
  `${label} ${index + 1}`,
  (value) => read(value)[index],
  (value, image) => { read(value)[index] = image; },
));

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
    ...list("Business — při práci", data, (v) => v.business.atWork),
    single("Eventy — hero", (v) => v.events.hero, (v, image) => { v.events.hero = image; }),
    ...list("Eventy — reportáž", data, (v) => v.events.reportage),
  ];
}

export function EditorialImageEditor({ editorial, photos }: { editorial: EditorialImages; photos: GalleryPhoto[] }) {
  const [data, setData] = useState(editorial);
  const [active, setActive] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const slots = imageSlots(data);

  function update(slot: Slot, image: EditorialImage) {
    setData((current) => {
      const next = structuredClone(current);
      slot.write(next, image);
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map((slot) => {
        const image = slot.read(data);
        return <article key={slot.label} className="border border-white/10 p-3 space-y-3">
          <h3 className="text-sm font-medium">{slot.label}</h3>
          <div className="aspect-[4/3] bg-zinc-900">
            {image.publicId && <img src={cloudinaryUrl(image.publicId, "w_500,h_375,c_fill,q_auto,f_auto")} alt="" className="w-full h-full object-cover" />}
          </div>
          <button type="button" onClick={() => setActive(active === slot.label ? null : slot.label)} aria-label={`Změnit fotku: ${slot.label}`} className="text-xs underline underline-offset-4">
            {image.publicId ? "Změnit fotku" : "Vybrat fotku"}
          </button>
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
          <div className="grid grid-cols-2 gap-2">
            <input aria-label={`${slot.label} ořez desktop`} value={image.focal.desktop} onChange={(event) => update(slot, { ...image, focal: { ...image.focal, desktop: event.target.value } })} className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs" />
            <input aria-label={`${slot.label} ořez mobil`} value={image.focal.mobile} onChange={(event) => update(slot, { ...image, focal: { ...image.focal, mobile: event.target.value } })} className="bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs" />
          </div>
        </article>;
      })}
    </div>
    <div className="mt-4 flex items-center gap-3">
      <button type="button" onClick={save} disabled={status === "saving"} className="px-4 py-2 bg-white text-black text-sm font-medium disabled:opacity-50">Uložit editorialové fotky</button>
      {status === "ok" && <span className="text-sm text-green-400">Uloženo</span>}
      {status === "error" && <span className="text-sm text-red-400">Uložení selhalo</span>}
    </div>
  </section>;
}
