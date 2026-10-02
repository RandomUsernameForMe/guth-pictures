import React from "react";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { normalizeContent, normalizeImages, type ContentData } from "@/modules/admin/lib/content";
import { PreviewSurface } from "../PreviewSurface";
import { findByText } from "../protocol";

vi.mock("@/modules/editorial/components/HomeEditorial", () => ({
  HomeEditorial: ({ content }: { content: ContentData }) => <h1>{content.pages!.home.title}</h1>,
}));
vi.mock("@/modules/editorial/components/PortraitEditorial", () => ({ PortraitEditorial: () => null }));
vi.mock("@/modules/editorial/components/BusinessEditorial", () => ({ BusinessEditorial: () => null }));
vi.mock("@/modules/editorial/components/EventsEditorial", () => ({ EventsEditorial: () => null }));

const raw: ContentData = {
  home: { title: "Guth", subtitle: "" },
  "o-mne": { title: "", subtitle: "", bio: "" },
  sluzby: {
    portraits: { title: "", desc: "", packages: [] },
    weddings: { title: "", desc: "", packages: [] },
    business: { title: "", desc: "", packages: [] },
  },
  lightTesterPromo: { title: "", desc: "" },
  testimonials: [],
};
const content = normalizeContent(raw, "cs");
const draft = (title: string): ContentData => ({ ...content, pages: { ...content.pages, home: { ...content.pages.home, title } } });

const send = (data: unknown, origin = window.location.origin) =>
  act(() => { window.dispatchEvent(new MessageEvent("message", { data, origin, source: window })); });

describe("PreviewSurface", () => {
  it("re-renders with draft content from the admin", () => {
    render(<PreviewSurface page="home" locale="cs" content={content} images={normalizeImages({ profile: "" })} />);
    send({ type: "preview:data", content: draft("Nový nadpis") });
    expect(screen.getByRole("heading")).toHaveTextContent("Nový nadpis");
  });

  it("ignores messages from other origins", () => {
    render(<PreviewSurface page="home" locale="cs" content={content} images={normalizeImages({ profile: "" })} />);
    send({ type: "preview:data", content: draft("Podvrh") }, "https://evil.example");
    expect(screen.getByRole("heading")).not.toHaveTextContent("Podvrh");
  });
});

describe("findByText", () => {
  it("returns the element containing the text, ignoring whitespace differences", () => {
    document.body.innerHTML = "<main><p>Jiný text</p><h2>Až budete\n  u toho.</h2></main>";
    expect(findByText(document.body, "Až budete u toho.")?.tagName).toBe("H2");
    expect(findByText(document.body, "x")).toBeNull();
  });
});
