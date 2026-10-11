import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { EventsEditorial } from "../EventsEditorial";
import { normalizeContent, normalizeImages, type ContentData } from "@/modules/admin/lib/content";
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

const base = (pages?: ContentData["pages"]) => normalizeContent({
  home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [],
  editorial: { eventsTitle: "Až budete u toho." },
  sluzby: {
    portraits: { title: "", desc: "", packages: [] },
    weddings: { title: "Svatby", desc: "", packages: [{ name: "Celý den", price: "15 000 Kč", duration: "", includes: [] }], note: "Záloha" },
    business: { title: "", desc: "", packages: [] },
  },
  pages,
}, "cs");

it("renders admin-edited events copy", () => {
  const pages = { events: { infoTitle: "Vlastní nadpis z adminu" } } as ContentData["pages"];
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base(pages)} images={normalizeImages()} />);
  expect(html).toContain("Vlastní nadpis z adminu");
  expect(html).not.toContain("Lidé. Dění. Atmosféra.");
});

it("renders an events and weddings reportage with managed placeholders", () => {
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  expect(html).toContain("Až budete u toho.");
  expect(html).toContain("Eventy a svatby");
  expect(html).toContain("15 000 Kč");
  expect(html).toContain("Poptat termín");
  expect(html).toContain("Larp");
  expect(html).toContain("<form");
});

it("marks the page as coming soon in both locales", () => {
  const cs = renderToStaticMarkup(<EventsEditorial locale="cs" content={base()} images={normalizeImages()} />);
  const en = renderToStaticMarkup(<EventsEditorial locale="en" content={base()} images={normalizeImages()} />);
  expect(cs).toContain("Připravujeme");
  expect(en).toContain("Coming soon");
});
