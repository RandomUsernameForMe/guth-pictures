"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { ContentData, Testimonial } from "@/modules/admin/lib/content";
import { defaultPageCopy, type PageCopy } from "@/modules/admin/lib/page-copy";
import { AdminPreview, SPLIT_LAYOUT, type PreviewFocus } from "@/modules/admin/preview/AdminPreview";
import { isPreviewPage, type PreviewPage } from "@/modules/admin/preview/protocol";
import { ContactEmailForm } from "./ContactEmailForm";
import { Field, Section, SHOW_UNUSED_SECTIONS } from "./FormParts";
import { PageCopyEditor } from "./PageCopyEditor";
import { ProfilePhotoUploader } from "./ProfilePhotoUploader";
import { ServiceSection } from "./ServiceSection";

type Locale = "cs" | "en";

const emptyTestimonial = (): Testimonial => ({ id: crypto.randomUUID(), quote: "", author: "", role: "", photo: "" });

const emptyContent = (): ContentData => ({
  home: { title: "", subtitle: "" },
  "o-mne": { title: "", subtitle: "", bio: "" },
  lightTesterPromo: { title: "", desc: "" },
  editorial: { eventsTitle: "" },
  sluzby: {
    portraits: { title: "", desc: "", packages: [], note: "" },
    weddings: { title: "", desc: "", packages: [], note: "" },
    business: { title: "", desc: "", packages: [], extras: [], note: "" },
  },
  testimonials: [],
});

export function ContentEditor({ photos = [] }: { photos?: GalleryPhoto[] }) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("cs");
  const [data, setData] = useState<Record<Locale, ContentData>>({
    cs: emptyContent(),
    en: emptyContent(),
  });
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [previewPage, setPreviewPage] = useState<PreviewPage>("home");
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus | null>(null);

  useEffect(() => {
    async function load(url: string) {
      const r = await fetch(url);
      if (r.status === 401) { router.push("/admin/login"); return null; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }

    Promise.all([
      load("/api/admin/content?locale=cs"),
      load("/api/admin/content?locale=en"),
    ]).then(([cs, en]) => {
      if (cs) setData({ cs, en: en ?? emptyContent() });
    }).catch(() => {
      // fetch failed, state stays at empty defaults
    });
  }, [router]);

  const current = data[locale];
  const pageTemplate = useMemo(() => defaultPageCopy(locale), [locale]);

  function pageEditor<K extends keyof PageCopy>(key: K) {
    const pages = current.pages;
    if (!pages) return null;
    return (
      <PageCopyEditor
        name={key}
        value={pages[key]}
        template={pageTemplate[key]}
        onChange={(v) => patch((d) => { d.pages = { ...(d.pages ?? pageTemplate), [key]: v }; })}
      />
    );
  }

  // Focusing a text field switches the preview to its page and scrolls to the field's text.
  function focusPreview(event: React.FocusEvent<HTMLFormElement>) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    const page = field.closest<HTMLElement>("[data-preview-page]")?.dataset.previewPage;
    if (page && isPreviewPage(page)) setPreviewPage(page);
    if (field.value.trim()) setPreviewFocus({ text: field.value });
  }

  function switchLocale(next: Locale) {
    setLocale(next);
    setStatus("idle");
  }

  function patch(updater: (d: ContentData) => void) {
    setData((prev) => {
      const copy = structuredClone(prev);
      updater(copy[locale]);
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      // Drop unfinished testimonial rows (e.g. a freshly-added empty one) so a
      // blank row doesn't make the whole save fail server-side validation.
      const payload: ContentData = {
        ...current,
        testimonials: (current.testimonials ?? []).filter(
          (t) => t.quote.trim() !== "" && t.author.trim() !== "",
        ),
      };
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, data: payload }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-12 space-y-16">

      <ContactEmailForm />

      <ProfilePhotoUploader />

      {/* Texty webu */}
      <div className={SPLIT_LAYOUT}>
      <div>
      <h2 className="text-xl font-semibold mb-6">Texty webu</h2>

      <div className="flex gap-2 mb-6">
        {(["cs", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => switchLocale(l)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              locale === l ? "bg-white text-black" : "border border-white/20 hover:border-white"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} onFocus={focusPreview} className="space-y-6">
        <Section title="Patička">
          <Field
            label="Nadpis"
            value={current.home.title}
            onChange={(v) => patch((d) => { d.home.title = v; })}
          />
          <Field
            label="Podnadpis"
            value={current.home.subtitle}
            onChange={(v) => patch((d) => { d.home.subtitle = v; })}
          />
        </Section>

        <Section title="Eventy a svatby" page="eventy">
          <Field
            label="Hlavní nadpis"
            value={current.editorial?.eventsTitle ?? ""}
            onChange={(v) => patch((d) => { d.editorial = { eventsTitle: v }; })}
          />
          {pageEditor("events")}
        </Section>

        <Section title="Homepage" page="home">
          {pageEditor("home")}
        </Section>

        <Section title="Light planner — karta na homepage" page="home">
          {SHOW_UNUSED_SECTIONS && <Field
            label="Nadpis"
            value={current.lightTesterPromo.title}
            onChange={(v) => patch((d) => { d.lightTesterPromo.title = v; })}
          />}
          <Field
            label="Popis"
            value={current.lightTesterPromo.desc}
            onChange={(v) => patch((d) => { d.lightTesterPromo.desc = v; })}
            textarea
          />
        </Section>

        <Section title="O mně">
          <Field
            label="Nadpis"
            value={current["o-mne"].title}
            onChange={(v) => patch((d) => { d["o-mne"].title = v; })}
          />
          <Field
            label="Podnadpis"
            value={current["o-mne"].subtitle}
            onChange={(v) => patch((d) => { d["o-mne"].subtitle = v; })}
          />
          <Field
            label="Bio"
            value={current["o-mne"].bio}
            onChange={(v) => patch((d) => { d["o-mne"].bio = v; })}
            textarea
          />
          {pageEditor("about")}
        </Section>

        <Section title="Kreativní portrét — texty stránky" page="portrety">
          {pageEditor("portrait")}
        </Section>

        <Section title="Brandové focení — texty stránky">
          {pageEditor("brand")}
        </Section>

        <Section title="Firemní portréty — texty stránky" page="business">
          {pageEditor("business")}
        </Section>

        <Section title="Služby — texty stránky">
          {pageEditor("services")}
        </Section>

        <ServiceSection service="portraits" title="Portréty" page="portrety" content={current} patch={patch} />

        <ServiceSection service="weddings" title="Svatby" page="eventy" content={current} patch={patch} />

        <ServiceSection service="business" title="Firemní portréty" page="business" content={current} patch={patch} showExtras />

        {SHOW_UNUSED_SECTIONS && <Section title="Reference (testimonials)">
          <TestimonialEditor
            testimonials={current.testimonials ?? []}
            onChange={(items) => patch((d) => { d.testimonials = items; })}
            photos={photos}
          />
        </Section>}

        <div className="sticky bottom-0 z-10 flex items-center gap-4 bg-black/90 py-3 backdrop-blur">
          <button
            type="submit"
            disabled={status === "saving"}
            className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {status === "saving" ? "Ukládám…" : "Uložit"}
          </button>
          {status === "ok" && <span className="text-green-400 text-sm">Uloženo</span>}
          {status === "error" && <span className="text-red-400 text-sm">Chyba při ukládání</span>}
        </div>
      </form>
      </div>
      <AdminPreview
        page={previewPage}
        onPageChange={setPreviewPage}
        locale={locale}
        onLocaleChange={switchLocale}
        content={current.pages ? current : undefined}
        focus={previewFocus}
      />
      </div>

    </div>
  );
}

function TestimonialEditor({
  testimonials,
  onChange,
  photos,
}: {
  testimonials: Testimonial[];
  onChange: (items: Testimonial[]) => void;
  photos: GalleryPhoto[];
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [pickerOpenId, setPickerOpenId] = useState<string | null>(null);

  function update(i: number, updater: (t: Testimonial) => void) {
    const next = testimonials.map((t, idx) => {
      if (idx !== i) return t;
      const copy = structuredClone(t);
      updater(copy);
      return copy;
    });
    onChange(next);
  }

  function add() { onChange([...testimonials, emptyTestimonial()]); }
  function remove(i: number) { onChange(testimonials.filter((_, idx) => idx !== i)); }

  async function uploadPhoto(i: number, file: File, id: string) {
    setUploadingId(id);
    setErrorId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const { publicId } = await res.json();
      update(i, (t) => { t.photo = publicId; });
    } catch {
      setErrorId(id); // leave photo unchanged, surface failure
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Reference se na webu zobrazí jen pokud existuje alespoň jedna.</p>
      {testimonials.map((t, i) => (
        <div key={t.id ?? String(i)} className="border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Reference {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={uploadingId === (t.id ?? String(i))}
              className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Odebrat
            </button>
          </div>
          <textarea
            placeholder="Citace / co klient řekl"
            value={t.quote}
            onChange={(e) => update(i, (x) => { x.quote = e.target.value; })}
            rows={3}
            className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Jméno (autor)"
              value={t.author}
              onChange={(e) => update(i, (x) => { x.author = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
            <input
              type="text"
              placeholder="Role / popis (volitelné)"
              value={t.role ?? ""}
              onChange={(e) => update(i, (x) => { x.role = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
          </div>
          <div className="flex items-center gap-4">
            {t.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cloudinaryUrl(t.photo, "w_64,h_64,c_fill,g_face,q_auto,f_auto")}
                alt={t.author || "Foto reference"}
                className="w-12 h-12 object-cover rounded-full"
              />
            ) : (
              <span className="text-xs text-gray-500">Bez fotky</span>
            )}
            {photos.length > 0 && (
              <button
                type="button"
                onClick={() => setPickerOpenId((cur) => (cur === (t.id ?? String(i)) ? null : (t.id ?? String(i))))}
                className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
              >
                {pickerOpenId === (t.id ?? String(i)) ? "Zavřít výběr" : "Vybrat z fotek"}
              </button>
            )}
            <label className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30 cursor-pointer">
              {uploadingId === (t.id ?? String(i)) ? "Nahrávám…" : "Nahrát novou"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingId === (t.id ?? String(i))}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(i, file, t.id ?? String(i));
                  e.target.value = "";
                }}
              />
            </label>
            {t.photo && (
              <button
                type="button"
                onClick={() => update(i, (x) => { x.photo = ""; })}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Odebrat fotku
              </button>
            )}
            {errorId === (t.id ?? String(i)) && (
              <span className="text-xs text-red-400">Nahrávání selhalo</span>
            )}
          </div>
          {pickerOpenId === (t.id ?? String(i)) && photos.length > 0 && (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-2 max-h-64 overflow-y-auto border border-white/10 p-2">
              {photos.map((p) => {
                const selected = t.photo === p.publicId;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.publicId}
                    src={cloudinaryUrl(p.publicId, "w_80,h_80,c_fill,g_face,q_auto,f_auto")}
                    alt=""
                    onClick={() => { update(i, (x) => { x.photo = p.publicId; }); setPickerOpenId(null); }}
                    className={`w-full aspect-square object-cover cursor-pointer transition-opacity hover:opacity-100 ${selected ? "ring-2 ring-white opacity-100" : "opacity-70"}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
      >
        + Přidat referenci
      </button>
    </div>
  );
}
