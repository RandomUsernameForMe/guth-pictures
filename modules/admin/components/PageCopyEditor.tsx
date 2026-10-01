"use client";

import { useId } from "react";

// Renders a form for any copy tree (texts, lists, FAQ) based on the shape of its defaults.
type Value = string | Value[] | { [key: string]: Value };

// Keys looked up as "<parent>.<key>" first, then "<key>"; unknown keys show the raw name.
const LABELS: Record<string, string> = {
  title: "Nadpis",
  heroTitle: "Hlavní nadpis",
  intro: "Úvodní text",
  kicker: "Nadtitulek",
  eyebrow: "Nadtitulek",
  cta: "Tlačítko",
  heroCta: "Tlačítko",
  heroSubtitle: "Podnadpis",
  subtitle: "Podnadpis",
  description: "Popis pro Google",
  metaTitle: "Název stránky (Google, odkazy)",
  metaDescription: "Popis pro Google",
  "portrait.title": "Název stránky (Google, odkazy)",
  "brand.title": "Název stránky (Google, odkazy)",
  creative: "Služba 01",
  business: "Služba 02",
  events: "Služba 03",
  work: "Nadpis — vybrané příběhy",
  aboutKicker: "Nadtitulek — o mně",
  about: "Nadpis — o mně",
  aboutLink: "Odkaz na O mně",
  tools: "Nadpis — nástroje",
  foceni101Desc: "Focení 101 — popis",
  foceni101Cta: "Focení 101 — tlačítko",
  plannerCta: "Light planner — tlačítko",
  plannerNotice: "Light planner — upozornění",
  contact: "Nadpis — kontakt",
  steps: "Kroky",
  "steps.title": "Název kroku",
  "steps.desc": "Popis kroku",
  pricing: "Nadpis ceníku",
  pricingTitle: "Nadpis ceníku",
  processTitle: "Nadpis — průběh",
  lightQuestion: "Otázka u odkazu na Focení 101",
  audience: "Pro koho — text",
  audienceTitle: "Pro koho — nadpis",
  preparation: "Příprava — text",
  preparationTitle: "Příprava — nadpis",
  delivery: "Co dostanete — text",
  deliveryTitle: "Co dostanete — nadpis",
  workTitle: "Ukázky — nadpis",
  workLink: "Ukázky — odkaz na portfolio",
  stepsTitle: "Průběh — nadpis",
  questions: "Časté otázky",
  faq: "Časté otázky",
  faqTitle: "Časté otázky — nadpis",
  q: "Otázka",
  a: "Odpověď",
  useCasesTitle: "Využití — nadpis",
  useCases: "Využití",
  "useCases.title": "Název",
  "useCases.desc": "Popis",
  headshotsTitle: "Headshoty — nadpis",
  headshotsDesc: "Headshoty — popis",
  atWorkTitle: "Firma v akci — nadpis",
  atWorkDesc: "Firma v akci — popis",
  select: "Tlačítko u balíčku",
  contactTitle: "Kontakt — nadpis",
  contactSubtitle: "Kontakt — podnadpis",
  placeholder: "Text místo chybějící fotky",
  infoTitle: "Nadpis — atmosféra",
  infoText: "Text — atmosféra",
  larpLink: "Odkaz na larpy",
  portfolioLink: "Tlačítko Portfolio",
  servicesLink: "Tlačítko Služby",
};

// Fields the site no longer renders (business extras are hidden).
const HIDDEN = new Set(["extrasTitle"]);

const labelFor = (parent: string, key: string) => LABELS[`${parent}.${key}`] ?? LABELS[key] ?? key;

const blank = (template: Value): Value =>
  typeof template === "string" ? ""
    : Array.isArray(template) ? []
    : Object.fromEntries(Object.entries(template).map(([key, value]) => [key, blank(value)]));

const inputClass = "w-full bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40";
const smallButton = "text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 hover:border-white/30";

function TextField({ label, value, long, onChange }: { label: string; value: string; long: boolean; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-gray-400 mb-1">{label}</label>
      {long ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={4} className={`${inputClass} resize-y`} />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      )}
    </div>
  );
}

function ListField({ name, label, value, template, onChange }: {
  name: string; label: string; value: Value[]; template: Value[]; onChange: (v: Value[]) => void;
}) {
  const item = template[0] ?? "";
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">{label}</p>
      {value.map((entry, i) => (
        <div key={i} className="border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 uppercase tracking-wider">{i + 1}.</span>
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              Odebrat
            </button>
          </div>
          <Node name={name} label="" value={entry} template={item} onChange={(next) => onChange(value.map((v, idx) => (idx === i ? next : v)))} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, blank(item)])} className={smallButton}>+ Přidat</button>
    </div>
  );
}

function Node({ name, label, value, template, onChange }: {
  name: string; label: string; value: Value; template: Value; onChange: (v: Value) => void;
}) {
  if (typeof template === "string") {
    return <TextField label={label || "Text"} value={typeof value === "string" ? value : ""} long={template.length > 80} onChange={onChange} />;
  }
  if (Array.isArray(template)) {
    return <ListField name={name} label={label} value={Array.isArray(value) ? value : []} template={template} onChange={onChange} />;
  }
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return (
    <div className="space-y-4">
      {Object.entries(template).filter(([key]) => !HIDDEN.has(key)).map(([key, child]) => (
        <Node
          key={key}
          name={key}
          label={labelFor(name, key)}
          value={record[key] ?? blank(child)}
          template={child}
          onChange={(next) => onChange({ ...record, [key]: next })}
        />
      ))}
    </div>
  );
}

export function PageCopyEditor<T extends object>({ name, value, template, onChange }: {
  name: string; value: T; template: T; onChange: (v: T) => void;
}) {
  return (
    <Node
      name={name}
      label=""
      value={value as unknown as Value}
      template={template as unknown as Value}
      onChange={(next) => onChange(next as unknown as T)}
    />
  );
}
