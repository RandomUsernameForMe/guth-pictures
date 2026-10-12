"use client";

import type { ContentData } from "@/modules/admin/lib/content";
import type { PreviewPage } from "@/modules/admin/preview/protocol";
import { Field, PackageEditor, Section, SHOW_UNUSED_SECTIONS } from "./FormParts";

type ServiceKey = keyof ContentData["sluzby"];

export function ServiceSection({
  service,
  title,
  page,
  content,
  patch,
  showExtras = false,
}: {
  service: ServiceKey;
  title: string;
  page: PreviewPage;
  content: ContentData;
  patch: (updater: (d: ContentData) => void) => void;
  showExtras?: boolean;
}) {
  const s = content.sluzby[service];
  return (
    <Section title={title} page={page}>
      <Field
        label="Nadpis"
        value={s.title}
        onChange={(v) => patch((d) => { d.sluzby[service].title = v; })}
      />
      <Field
        label="Popis"
        value={s.desc}
        onChange={(v) => patch((d) => { d.sluzby[service].desc = v; })}
        textarea
      />
      <PackageEditor
        packages={s.packages ?? []}
        onChange={(pkgs) => patch((d) => { d.sluzby[service].packages = pkgs; })}
      />
      {SHOW_UNUSED_SECTIONS && showExtras && <PackageEditor
        label="Příplatky"
        addLabel="+ Přidat příplatek"
        simple
        packages={s.extras ?? []}
        onChange={(pkgs) => patch((d) => { d.sluzby[service].extras = pkgs; })}
      />}
      <Field
        label="Poznámka pod ceníkem"
        value={s.note ?? ""}
        onChange={(v) => patch((d) => { d.sluzby[service].note = v; })}
      />
    </Section>
  );
}
