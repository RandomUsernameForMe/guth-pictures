import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PortraitEditorial } from "../PortraitEditorial";
import { normalizeContent, normalizeImages } from "@/modules/admin/lib/content";
import { servicePages } from "@/modules/homepage/lib/service-pages";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));

it("renders a dark portrait exhibition with pricing, learning link and contact", () => {
  const content = normalizeContent({ home: { title: "", subtitle: "" }, "o-mne": { title: "", subtitle: "", bio: "" }, lightTesterPromo: { title: "", desc: "" }, testimonials: [], sluzby: { portraits: { title: "Portréty", desc: "", packages: [{ name: "Základ", price: "2 500 Kč", duration: "1 h", includes: [] }] }, weddings: { title: "", desc: "", packages: [] }, business: { title: "", desc: "", packages: [] } } }, "cs");
  const html = renderToStaticMarkup(<PortraitEditorial locale="cs" copy={servicePages["portretni-foceni"].cs} content={content} images={normalizeImages()} />);
  expect(html).toContain("Tvoje tvář. Jinak.");
  expect(html).toContain("2 500 Kč");
  expect(html).toContain('href="/foceni-101"');
  expect(html).toContain("<form");
  expect(html).toContain('class="editorial-portrait"');
});
