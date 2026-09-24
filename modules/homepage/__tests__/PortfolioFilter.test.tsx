import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioFilter } from "@/modules/homepage/components/PortfolioFilter";
import type { GalleryPhoto } from "@/lib/cloudinary-utils";

const query = vi.hoisted(() => ({ category: null as string | null }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query.category ? { category: query.category } : {}),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      filterAll: "Vše",
      "categories.portréty": "Portréty",
      "categories.svatby": "Svatby",
    };
    return translations[key] ?? key;
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

// Mock Lightbox (nechceme testovat jeho chování tady)
vi.mock("@/components/Lightbox", () => ({
  Lightbox: () => null,
}));

const makePhoto = (
  id: string,
  category: GalleryPhoto["category"]
): GalleryPhoto => ({
  publicId: id,
  width: 800,
  height: 600,
  alt: { cs: `alt-${id}`, en: `alt-${id}-en` },
  category,
});

const photos: GalleryPhoto[] = [
  makePhoto("p1", "portréty"),
  makePhoto("p2", "portréty"),
  makePhoto("s1", "svatby"),
];

describe("PortfolioFilter", () => {
  beforeEach(() => { query.category = null; });

  it("aplikuje kategorii z URL a reaguje na změnu navigace", () => {
    query.category = "portréty";
    const { rerender } = render(<PortfolioFilter photos={photos} locale="cs" />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    query.category = "svatby";
    rerender(<PortfolioFilter photos={photos} locale="cs" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByAltText("alt-s1")).toBeInTheDocument();
    query.category = "neplatná";
    rerender(<PortfolioFilter photos={photos} locale="cs" />);
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("zobrazí všechny fotky při startu (žádný filtr)", () => {
    render(<PortfolioFilter photos={photos} locale="cs" />);
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("zobrazí tlačítka pro všechny kategorie + Vše", () => {
    render(<PortfolioFilter photos={photos} locale="cs" />);
    expect(screen.getByRole("button", { name: "Vše" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Portréty" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Svatby" })).toBeInTheDocument();
  });

  it("filtruje na portréty po kliknutí", async () => {
    const user = userEvent.setup();
    render(<PortfolioFilter photos={photos} locale="cs" />);
    await user.click(screen.getByRole("button", { name: "Portréty" }));
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByAltText("alt-p1")).toBeInTheDocument();
    expect(screen.getByAltText("alt-p2")).toBeInTheDocument();
  });

  it("filtruje na svatby po kliknutí", async () => {
    const user = userEvent.setup();
    render(<PortfolioFilter photos={photos} locale="cs" />);
    await user.click(screen.getByRole("button", { name: "Svatby" }));
    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByAltText("alt-s1")).toBeInTheDocument();
  });

  it("vrátí všechny fotky po kliknutí na Vše", async () => {
    const user = userEvent.setup();
    render(<PortfolioFilter photos={photos} locale="cs" />);
    await user.click(screen.getByRole("button", { name: "Portréty" }));
    await user.click(screen.getByRole("button", { name: "Vše" }));
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("edge case: prázdné pole fotek nezpůsobí crash", () => {
    render(<PortfolioFilter photos={[]} locale="cs" />);
    expect(screen.getByRole("button", { name: "Vše" })).toBeInTheDocument();
  });

  it("edge case: filtr kategorie bez fotek zobrazí prázdný stav", async () => {
    const user = userEvent.setup();
    render(<PortfolioFilter photos={[makePhoto("p1", "portréty")]} locale="cs" />);
    await user.click(screen.getByRole("button", { name: "Svatby" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
