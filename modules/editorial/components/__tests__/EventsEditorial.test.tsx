import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { EventsEditorial } from "../EventsEditorial";
import { normalizeImages } from "@/modules/admin/lib/content";
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

it("renders an events and weddings reportage with managed placeholders", () => {
  const weddings = { title: "Svatby", desc: "", packages: [{ name: "Celý den", price: "15 000 Kč", duration: "", includes: [] }], note: "Záloha" };
  const html = renderToStaticMarkup(<EventsEditorial locale="cs" title="Až budete u toho." weddings={weddings} images={normalizeImages()} />);
  expect(html).toContain("Až budete u toho.");
  expect(html).toContain("Eventy a svatby");
  expect(html).toContain("15 000 Kč");
  expect(html).toContain("Poptat termín");
  expect(html).toContain("Larp");
  expect(html).toContain("<form");
});
