import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ServicesPage from "@/app/[locale]/sluzby/page";
import AboutPage from "@/app/[locale]/o-mne/page";

const content = {
  "o-mne": { title: "Tomáš", subtitle: "Fotograf z Prahy", bio: "Fotím lidi tak, jací jsou." },
  sluzby: {
    portraits: { title: "Portréty", desc: "Portrétní focení", packages: [] },
    weddings: { title: "Svatby", desc: "Svatební reportáž", packages: [] },
    business: { title: "Business", desc: "Firemní portréty", packages: [] },
  },
};

vi.mock("next-intl", () => ({ useLocale: () => "cs" }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form aria-label="Kontakt" /> }));
vi.mock("@/modules/admin/lib/content", () => ({
  getContent: async () => content,
  getImages: async () => ({ profile: "" }),
}));

describe("secondary editorial pages", () => {
  it("renders services in the editorial shell", async () => {
    const html = renderToStaticMarkup(await ServicesPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-services")).not.toBeNull();
    expect(doc.querySelector(".ed-secondary-hero h1")?.textContent).toBe("sluzby.title");
    expect(doc.querySelectorAll("details")).toHaveLength(9);
  });

  it("renders the admin-managed profile without an empty image frame", async () => {
    const html = renderToStaticMarkup(await AboutPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-about")).not.toBeNull();
    expect(doc.querySelector("h1")?.textContent).toBe("Tomáš");
    expect(doc.querySelector("img")).toBeNull();
  });
});
