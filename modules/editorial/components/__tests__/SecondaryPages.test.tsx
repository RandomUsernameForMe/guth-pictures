import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ServicesPage from "@/app/[locale]/sluzby/page";
import AboutPage from "@/app/[locale]/o-mne/page";
import PortfolioPage from "@/app/[locale]/portfolio/page";
import BlogPage from "@/app/[locale]/blog/page";
import BlogPostPage from "@/app/[locale]/blog/[slug]/page";
import TermsPage from "@/app/[locale]/vop/page";
import PrivacyPage from "@/app/[locale]/privacy/page";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

const content = {
  "o-mne": { title: "Tomáš", subtitle: "Fotograf z Prahy", bio: "Fotím lidi tak, jací jsou." },
  sluzby: {
    portraits: { title: "Portréty", desc: "Portrétní focení", packages: [] },
    weddings: { title: "Svatby", desc: "Svatební reportáž", packages: [] },
    business: { title: "Business", desc: "Firemní portréty", packages: [] },
  },
  pages: defaultPageCopy("cs"),
};

vi.mock("next-intl", () => ({ useLocale: () => "cs" }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (key: string) => key }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next/image", () => ({ default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} /> }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
  usePathname: () => "/test-page",
}));
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form aria-label="Kontakt" /> }));
vi.mock("@/modules/admin/lib/content", () => ({
  getContent: async () => content,
  getImages: async () => ({ profile: "" }),
}));
vi.mock("@/lib/cloudinary", () => ({ getGalleryPhotos: async () => { throw new Error("offline"); } }));
vi.mock("@/modules/blog/lib/blog", () => ({
  getBlogPosts: async () => [],
  getBlogPost: async () => ({
    id: "article",
    slug: "article",
    published: true,
    publishedAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    coverImage: "",
    cs: { title: "Článek", excerpt: "Perex", content: "## Nadpis\n\nText článku." },
    en: { title: "Article", excerpt: "Intro", content: "## Heading\n\nArticle text." },
  }),
}));

describe("secondary editorial pages", () => {
  it("renders services in the editorial shell", async () => {
    const html = renderToStaticMarkup(await ServicesPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-services")).not.toBeNull();
    expect(doc.querySelector(".ed-secondary-hero h1")?.textContent).toBe("Služby");
    expect(doc.querySelectorAll("details")).toHaveLength(9);
  });

  it("renders the admin-managed profile without an empty image frame", async () => {
    const html = renderToStaticMarkup(await AboutPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-about")).not.toBeNull();
    expect(doc.querySelector("h1")?.textContent).toBe("Tomáš");
    expect(doc.querySelector("img")).toBeNull();
  });

  it("renders an intentional portfolio error state in the editorial shell", async () => {
    const html = renderToStaticMarkup(await PortfolioPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-portfolio")).not.toBeNull();
    expect(doc.querySelector("[role=status]")?.textContent).toContain("Galerii se nepodařilo načíst");
  });

  it("renders an intentional empty blog state in the editorial shell", async () => {
    const html = renderToStaticMarkup(await BlogPage({ params: Promise.resolve({ locale: "cs" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-blog")).not.toBeNull();
    expect(doc.querySelector(".ed-secondary-empty")?.textContent).toBe("empty");
  });

  it("renders blog articles in the same editorial shell", async () => {
    const html = renderToStaticMarkup(await BlogPostPage({ params: Promise.resolve({ locale: "cs", slug: "article" }) }));
    const doc = new DOMParser().parseFromString(html, "text/html");

    expect(doc.querySelector("main.editorial-secondary.ed-secondary-article")).not.toBeNull();
    expect(doc.querySelector("article h1")?.textContent).toBe("Článek");
  });

  it("renders both legal documents in the editorial reading layout", async () => {
    for (const page of [TermsPage, PrivacyPage]) {
      const html = renderToStaticMarkup(await page({ params: Promise.resolve({ locale: "cs" }) }));
      const doc = new DOMParser().parseFromString(html, "text/html");

      expect(doc.querySelector("main.editorial-secondary.ed-secondary-legal")).not.toBeNull();
      expect(doc.querySelector("article.ed-legal h1")).not.toBeNull();
      expect(doc.querySelectorAll("article.ed-legal section").length).toBeGreaterThan(7);
    }
  });
});
