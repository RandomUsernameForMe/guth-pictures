import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BusinessEditorial } from "../BusinessEditorial";
import { normalizeImages } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("../EditorialNav", () => ({ EditorialNav: () => <nav /> }));

it("keeps business pricing and renders managed placeholders", () => {
  const business = { title: "Business", desc: "", packages: [{ name: "Tým", price: "950 Kč / osoba", duration: "", includes: [] }], extras: [], note: "Praha v ceně" };
  const html = renderToStaticMarkup(<BusinessEditorial locale="cs" copy={defaultPageCopy("cs").business} business={business} images={normalizeImages()} />);
  expect(html).toContain("Tvoje práce. Tvoje tvář.");
  expect(html).toContain("950 Kč / osoba");
  expect(html).toContain("Ukázka brzy");
  expect(html).toContain("FAQPage");
  expect(html).toContain("<form");
});
