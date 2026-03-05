"use client";

import { useEffect, useState } from "react";
import type { ContentData } from "@/lib/content";

type Locale = "cs" | "en";

const emptyContent = (): ContentData => ({
  home: { title: "", subtitle: "" },
  "o-mne": { title: "", subtitle: "", bio: "" },
  sluzby: {
    portraits: { title: "", desc: "" },
    weddings: { title: "", desc: "" },
    larp: { title: "", desc: "" },
  },
});

export function ContentEditor() {
  const [locale, setLocale] = useState<Locale>("cs");
  const [data, setData] = useState<Record<Locale, ContentData>>({
    cs: emptyContent(),
    en: emptyContent(),
  });
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content?locale=cs").then((r) => r.json()),
      fetch("/api/admin/content?locale=en").then((r) => r.json()),
    ]).then(([cs, en]) => setData({ cs, en }));
  }, []);

  const current = data[locale];

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
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, data: current }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-12">
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
        <Section title="Hero">
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
        </Section>

        <Section title="Larpy">
          <Field
            label="Nadpis"
            value={current.sluzby.larp.title}
            onChange={(v) => patch((d) => { d.sluzby.larp.title = v; })}
          />
          <Field
            label="Popis"
            value={current.sluzby.larp.desc}
            onChange={(v) => patch((d) => { d.sluzby.larp.desc = v; })}
            textarea
          />
        </Section>

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
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
        />
      )}
    </div>
  );
}
