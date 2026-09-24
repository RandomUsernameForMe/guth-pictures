import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { ContactForm } from "@/components/ContactForm";
import { PortfolioFilter } from "@/modules/homepage/components/PortfolioFilter";
import { ServiceCards } from "@/modules/homepage/components/ServiceCards";

vi.mock("next/navigation", () => ({
  useSearchParams: () => { throw new Promise(() => {}); },
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/modules/gallery/components/PhotoGrid", () => ({
  PhotoGrid: () => <img src="/portrait.jpg" alt="Published portrait" />,
}));

describe("SEO server rendering", () => {
  it("contains query suspension within the contact form", () => {
    expect(() => renderToString(<ContactForm />)).not.toThrow();
  });

  it("renders portfolio images even when URL parameters suspend", () => {
    expect(renderToString(<PortfolioFilter photos={[]} locale="cs" />)).toContain("Published portrait");
  });

  it("includes package prices and deliverables before opening a card", () => {
    const html = renderToStaticMarkup(<ServiceCards selectLabel="Vybrat" services={[{
      key: "portraits", number: "001", category: "portréty", title: "Portréty", desc: "Portrétní focení",
      packages: [{ name: "Základ", price: "2 500 Kč", duration: "1,5 hod", includes: ["7 upravených fotek"] }],
    }]} />);
    expect(html).toContain("2 500 Kč");
    expect(html).toContain("7 upravených fotek");
    expect(html).toContain("<details");
    expect(html).toContain("<summary");
  });
});
