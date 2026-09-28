import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ServicePage, { generateMetadata, generateStaticParams } from "@/app/[locale]/sluzby/[service]/page";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn() }));
vi.mock("@/components/ContactForm", () => ({ ContactForm: () => <form /> }));
vi.mock("@/modules/editorial/components/EditorialNav", () => ({ EditorialNav: () => <nav /> }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ children, href }: React.PropsWithChildren<{ href: string }>) => <a href={href}>{children}</a> }));
vi.mock("@/lib/cloudinary", () => ({ getGalleryPhotos: async () => [] }));
vi.mock("@/modules/admin/lib/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/admin/lib/content")>();
  return {
    ...actual,
    getContent: async () => ({ sluzby: { portraits: {
      title: "Portrait package", desc: "From CMS", packages: [
        { name: "Studio", price: "3 000 Kč", duration: "1 h", includes: ["Edited images"] },
      ],
    } } }),
    getImages: async () => actual.normalizeImages(),
  };
});

describe("service pages", () => {
  for (const locale of ["cs", "en"]) {
    for (const { service } of generateStaticParams()) {
      it(`renders ${locale}/${service} with metadata and structured data`, async () => {
        const props = { params: Promise.resolve({ locale, service }) };
        const html = renderToStaticMarkup(await ServicePage(props));
        const doc = new DOMParser().parseFromString(html, "text/html");
        expect(doc.querySelectorAll("h1")).toHaveLength(1);
        expect(doc.querySelectorAll("h2").length).toBeGreaterThan(service === "portretni-foceni" ? 2 : 4);
        const schema = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
        expect(schema["@graph"][0]["@type"]).toBe("Service");
        expect(schema["@graph"][1]["@type"]).toBe("BreadcrumbList");
        if (service === "portretni-foceni") {
          expect(html).toContain("3 000 Kč");
          expect(doc.querySelector("main.editorial-portrait")).not.toBeNull();
        } else {
          expect(doc.querySelector('a[href="/firemni-portrety"]')).not.toBeNull();
        }
        const metadata = await generateMetadata(props);
        expect(metadata.alternates?.canonical).toBe(`/${locale}/sluzby/${service}`);
        expect(metadata.alternates?.languages?.en).toBe(`/en/sluzby/${service}`);
      });
    }
  }

  it("rejects an unknown service for both content and metadata", async () => {
    const props = { params: Promise.resolve({ locale: "cs", service: "unknown" }) };
    await expect(ServicePage(props)).rejects.toThrow("NOT_FOUND");
    await expect(generateMetadata(props)).rejects.toThrow("NOT_FOUND");
  });
});
