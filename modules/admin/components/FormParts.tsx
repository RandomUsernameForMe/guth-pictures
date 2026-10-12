"use client";

import { useId } from "react";
import type { PricingPackage } from "@/lib/types";
import type { PreviewPage } from "@/modules/admin/preview/protocol";

// Sekce, které web už nevykresluje (reference, nadpis Light Testeru, příplatky).
// Jen skryté — data v KV zůstávají a ukládají se beze změny.
export const SHOW_UNUSED_SECTIONS = false;

const emptyPackage = (): PricingPackage => ({ id: crypto.randomUUID(), name: "", price: "", duration: "", includes: [] });

export function Section({ title, page, children }: { title: string; page?: PreviewPage; children: React.ReactNode }) {
  return (
    <div className="border border-white/10 p-6" data-preview-page={page}>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Field({
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

export function PackageEditor({
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
