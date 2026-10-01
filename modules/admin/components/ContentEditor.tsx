"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cloudinaryUrl, type GalleryPhoto } from "@/lib/cloudinary-utils";
import type { ContentData, SiteImages, Testimonial } from "@/modules/admin/lib/content";
import type { PricingPackage } from "@/lib/types";
import { defaultPageCopy, type PageCopy } from "@/modules/admin/lib/page-copy";
import { PageCopyEditor } from "./PageCopyEditor";

type Locale = "cs" | "en";

// Sekce, které web už nevykresluje (reference, nadpis Light Testeru, příplatky).
// Jen skryté — data v KV zůstávají a ukládají se beze změny.
const SHOW_UNUSED_SECTIONS = false;

const emptyPackage = (): PricingPackage => ({ id: crypto.randomUUID(), name: "", price: "", duration: "", includes: [] });
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
  const [images, setImages] = useState<SiteImages>({ profile: "" });
  const [profileUploadStatus, setProfileUploadStatus] = useState<"idle" | "uploading" | "ok" | "error">("idle");
  const profileInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

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
      load("/api/admin/images"),
      load("/api/admin/email"),
    ]).then(([cs, en, imgs, emailData]) => {
      if (cs) setData({ cs, en: en ?? emptyContent() });
      if (imgs) setImages(imgs);
      if (emailData) setEmail(emailData.email ?? "");
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

  async function handleEmailSave(e: React.FormEvent) {
    e.preventDefault();
    setEmailStatus("saving");
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmailStatus("ok");
        setTimeout(() => setEmailStatus("idle"), 3000);
      } else {
        setEmailStatus("error");
      }
    } catch {
      setEmailStatus("error");
    }
  }

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
    <div className="mt-12 space-y-16">

      {/* Kontaktní email */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Kontaktní email</h2>
        <form onSubmit={handleEmailSave} className="space-y-4 max-w-2xl">
          <div className="border border-white/10 p-6 space-y-4">
            <Field
              label="Email (zobrazuje se v patičce a slouží pro kontaktní formulář)"
              value={email}
              onChange={setEmail}
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={emailStatus === "saving"}
              className="px-6 py-2 bg-white text-black font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {emailStatus === "saving" ? "Ukládám…" : "Uložit email"}
            </button>
            {emailStatus === "ok" && <span className="text-green-400 text-sm">Uloženo</span>}
            {emailStatus === "error" && <span className="text-red-400 text-sm">Chyba při ukládání</span>}
          </div>
        </form>
      </div>

      {/* Obrázky */}
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

      {/* Texty webu */}
      <div>
      <h2 className="text-xl font-semibold mb-6">Texty webu</h2>

      <div className="flex gap-2 mb-6">
        {(["cs", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => { setLocale(l); setStatus("idle"); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              locale === l ? "bg-white text-black" : "border border-white/20 hover:border-white"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Section title="Eventy a svatby">
          <Field
            label="Hlavní nadpis"
            value={current.editorial?.eventsTitle ?? ""}
            onChange={(v) => patch((d) => { d.editorial = { eventsTitle: v }; })}
          />
          {pageEditor("events")}
        </Section>

        <Section title="Homepage">
          {pageEditor("home")}
        </Section>

        <Section title="Light planner — karta na homepage">
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

        <Section title="Kreativní portrét — texty stránky">
          {pageEditor("portrait")}
        </Section>

        <Section title="Brandové focení — texty stránky">
          {pageEditor("brand")}
        </Section>

        <Section title="Firemní portréty — texty stránky">
          {pageEditor("business")}
        </Section>

        <Section title="Služby — texty stránky">
          {pageEditor("services")}
        </Section>

        <Section title="Portréty">
          <Field
            label="Nadpis"
            value={current.sluzby.portraits.title}
            onChange={(v) => patch((d) => { d.sluzby.portraits.title = v; })}
          />
          <Field
            label="Popis"
            value={current.sluzby.portraits.desc}
            onChange={(v) => patch((d) => { d.sluzby.portraits.desc = v; })}
            textarea
          />
          <PackageEditor
            packages={current.sluzby.portraits.packages ?? []}
            onChange={(pkgs) => patch((d) => { d.sluzby.portraits.packages = pkgs; })}
          />
          <Field
            label="Poznámka pod ceníkem"
            value={current.sluzby.portraits.note ?? ""}
            onChange={(v) => patch((d) => { d.sluzby.portraits.note = v; })}
          />
        </Section>

        <Section title="Svatby">
          <Field
            label="Nadpis"
            value={current.sluzby.weddings.title}
            onChange={(v) => patch((d) => { d.sluzby.weddings.title = v; })}
          />
          <Field
            label="Popis"
            value={current.sluzby.weddings.desc}
            onChange={(v) => patch((d) => { d.sluzby.weddings.desc = v; })}
            textarea
          />
          <PackageEditor
            packages={current.sluzby.weddings.packages ?? []}
            onChange={(pkgs) => patch((d) => { d.sluzby.weddings.packages = pkgs; })}
          />
          <Field
            label="Poznámka pod ceníkem"
            value={current.sluzby.weddings.note ?? ""}
            onChange={(v) => patch((d) => { d.sluzby.weddings.note = v; })}
          />
        </Section>

        <Section title="Firemní portréty">
          <Field
            label="Nadpis"
            value={current.sluzby.business.title}
            onChange={(v) => patch((d) => { d.sluzby.business.title = v; })}
          />
          <Field
            label="Popis"
            value={current.sluzby.business.desc}
            onChange={(v) => patch((d) => { d.sluzby.business.desc = v; })}
            textarea
          />
          <PackageEditor
            packages={current.sluzby.business.packages ?? []}
            onChange={(pkgs) => patch((d) => { d.sluzby.business.packages = pkgs; })}
          />
          {SHOW_UNUSED_SECTIONS && <PackageEditor
            label="Příplatky"
            addLabel="+ Přidat příplatek"
            simple
            packages={current.sluzby.business.extras ?? []}
            onChange={(pkgs) => patch((d) => { d.sluzby.business.extras = pkgs; })}
          />}
          <Field
            label="Poznámka pod ceníkem"
            value={current.sluzby.business.note ?? ""}
            onChange={(v) => patch((d) => { d.sluzby.business.note = v; })}
          />
        </Section>

        {SHOW_UNUSED_SECTIONS && <Section title="Reference (testimonials)">
          <TestimonialEditor
            testimonials={current.testimonials ?? []}
            onChange={(items) => patch((d) => { d.testimonials = items; })}
            photos={photos}
          />
        </Section>}

        <div className="flex items-center gap-4">
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

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 p-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-400 mb-1">{label}</label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
        />
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
        />
      )}
    </div>
  );
}

function PackageEditor({
  packages,
  onChange,
  label = "Balíčky ceníku",
  addLabel = "+ Přidat balíček",
  simple = false,
}: {
  packages: PricingPackage[];
  onChange: (pkgs: PricingPackage[]) => void;
  label?: string;
  addLabel?: string;
  simple?: boolean; // name + price only
}) {
  function updatePkg(i: number, updater: (p: PricingPackage) => void) {
    const next = packages.map((p, idx) => {
      if (idx !== i) return p;
      const copy = structuredClone(p);
      updater(copy);
      return copy;
    });
    onChange(next);
  }

  function addPkg() { onChange([...packages, emptyPackage()]); }
  function removePkg(i: number) { onChange(packages.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{label}</p>
      {packages.map((pkg, i) => (
        <div key={pkg.id ?? String(i)} className="border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{simple ? "Položka" : "Balíček"} {i + 1}</span>
            <button
              type="button"
              onClick={() => removePkg(i)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Odebrat
            </button>
          </div>
          <div className={`grid gap-2 ${simple ? "grid-cols-2" : "grid-cols-3"}`}>
            <input
              type="text"
              placeholder="Název"
              value={pkg.name}
              onChange={(e) => updatePkg(i, (p) => { p.name = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
            <input
              type="text"
              placeholder="Cena"
              value={pkg.price}
              onChange={(e) => updatePkg(i, (p) => { p.price = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />
            {!simple && <input
              type="text"
              placeholder="Délka"
              value={pkg.duration}
              onChange={(e) => updatePkg(i, (p) => { p.duration = e.target.value; })}
              className="bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40"
            />}
          </div>
          {!simple && <textarea
            placeholder={"Co zahrnuje (každá položka na nový řádek)"}
            value={pkg.includes.join("\n")}
            onChange={(e) => updatePkg(i, (p) => { p.includes = e.target.value.split("\n"); })}
            rows={3}
            className="w-full bg-white/5 border border-white/10 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
          />}
        </div>
      ))}
      <button
        type="button"
        onClick={addPkg}
        className="text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30"
      >
        {addLabel}
      </button>
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
