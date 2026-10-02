import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// --- Mocks ---

type MotionProps = {
  children?: React.ReactNode;
  initial?: unknown; animate?: unknown; exit?: unknown;
  whileInView?: unknown; viewport?: unknown; transition?: unknown; layoutId?: unknown;
  [key: string]: unknown;
};

vi.mock("framer-motion", () => {
  const make = (tag: string) =>
    ({ children, initial, animate, exit, whileInView, viewport, transition, layoutId, ...rest }: MotionProps) =>
      React.createElement(tag, rest, children);
  const mockMotionValue = { get: () => 0, on: () => () => {}, subscribe: () => () => {} };
  return {
    motion: {
      div: make("div"),
      h1: make("h1"),
      p: make("p"),
      span: make("span"),
      figure: make("figure"),
    },
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    useScroll: () => ({ scrollY: mockMotionValue }),
    useTransform: () => mockMotionValue,
    useMotionValueEvent: () => {},
  };
});

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, sizes, placeholder, blurDataURL, priority, ...rest }: {
    src: string; alt: string; fill?: boolean; sizes?: string;
    placeholder?: string; blurDataURL?: string; priority?: boolean; [key: string]: unknown;
  }) => <img src={src} alt={alt} {...rest} />,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children?: React.ReactNode; [key: string]: unknown }) =>
    <a href={href} {...rest}>{children}</a>,
  usePathname: () => "/",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// --- Test data ---

import type { GalleryPhoto } from "@/lib/cloudinary-utils";

const mockPhotos: GalleryPhoto[] = [
  { publicId: "foto/1", width: 800, height: 600, alt: { cs: "Portrét jeden", en: "Portrait one" }, category: "portréty" },
  { publicId: "foto/2", width: 800, height: 600, alt: { cs: "Svatba dva", en: "Wedding two" }, category: "svatby" },
  { publicId: "foto/3", width: 800, height: 600, alt: { cs: "Larp tři", en: "Larp three" }, category: "larpy" },
];

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
});

// =============================================================================
// AnimatedSection
// =============================================================================
import { AnimatedSection } from "@/components/AnimatedSection";

describe("AnimatedSection", () => {
  it("renderuje children", () => {
    render(<AnimatedSection><p>Obsah sekce</p></AnimatedSection>);
    expect(screen.getByText("Obsah sekce")).toBeInTheDocument();
  });

  it("předá className na wrapper", () => {
    const { container } = render(
      <AnimatedSection className="test-class"><span>x</span></AnimatedSection>
    );
    expect(container.firstChild).toHaveClass("test-class");
  });
});

// =============================================================================
// HeroSection
// =============================================================================
import { HeroSection } from "@/modules/homepage/components/HeroSection";

describe("HeroSection", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", class {
      observe() {}
      disconnect() {}
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const defaultProps = {
    title: "Guth Pictures",
    subtitle: "Portréty, svatby a larpy.",
    ctaPortfolio: "Prohlédnout portfolio",
    ctaContact: "Napsat mi",
    locale: "cs",
  };

  it("první fotky zobrazí bez fade, další výměny včetně návratu na začátek prolíná", () => {
    vi.useFakeTimers();
    const photos: [string[], string[], string[]] = [
      ["hero/a1", "hero/a2"], ["hero/b1", "hero/b2"], ["hero/c1", "hero/c2"],
    ];
    const { container, unmount } = render(<HeroSection {...defaultProps} photos={photos} />);
    try {
      const images = () => Array.from(container.querySelectorAll<HTMLImageElement>("#hero img"));
      expect(images()).toHaveLength(3);
      for (const image of images()) {
        expect(image.style.animation).not.toContain("heroFadeIn");
      }
      act(() => vi.advanceTimersByTime(6000));
      expect(images()).toHaveLength(6);
      expect(images().filter(image => image.style.animation.includes("heroFadeIn"))).toHaveLength(3);
      act(() => vi.advanceTimersByTime(6000));
      for (const first of ["hero/a1", "hero/b1", "hero/c1"]) {
        expect(images().find(image => image.src.endsWith(first))?.style.animation).toContain("heroFadeIn");
      }
    } finally {
      unmount();
    }
  });

  it("renderuje titulek", () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Guth Pictures");
  });

  it("renderuje podtitulek", () => {
    render(<HeroSection {...defaultProps} />);
    expect(screen.getByText("Portréty, svatby a larpy.")).toBeInTheDocument();
  });

  it("renderuje odkaz na portfolio", () => {
    render(<HeroSection {...defaultProps} />);
    const link = screen.getByRole("link", { name: "Prohlédnout portfolio" });
    expect(link).toHaveAttribute("href", "/portfolio");
  });

  it("renderuje odkaz na kontakt", () => {
    render(<HeroSection {...defaultProps} />);
    const link = screen.getByRole("link", { name: "Napsat mi →" });
    expect(link).toHaveAttribute("href", "#kontakt");
  });
});

// =============================================================================
// PortfolioFilter
// =============================================================================
import { PortfolioFilter } from "@/modules/homepage/components/PortfolioFilter";

describe("PortfolioFilter", () => {
  it("zobrazí tlačítko 'vše' a všechny kategorie", () => {
    render(<PortfolioFilter photos={mockPhotos} locale="cs" />);
    expect(screen.getByRole("button", { name: "filterAll" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /portréty/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /svatby/i })).toBeInTheDocument();
  });

  it("bez filtru zobrazí všechny fotky", () => {
    render(<PortfolioFilter photos={mockPhotos} locale="cs" />);
    expect(screen.getByAltText("Portrét jeden")).toBeInTheDocument();
    expect(screen.getByAltText("Svatba dva")).toBeInTheDocument();
    expect(screen.getByAltText("Larp tři")).toBeInTheDocument();
  });

  it("po kliknutí na kategorii zobrazí jen dané fotky", () => {
    render(<PortfolioFilter photos={mockPhotos} locale="cs" />);
    fireEvent.click(screen.getByRole("button", { name: /kategorie.*portréty|portréty/i }));
    expect(screen.getByAltText("Portrét jeden")).toBeInTheDocument();
    expect(screen.queryByAltText("Svatba dva")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Larp tři")).not.toBeInTheDocument();
  });

  it("po kliknutí na 'vše' po filtru zobrazí všechny fotky znovu", () => {
    render(<PortfolioFilter photos={mockPhotos} locale="cs" />);
    fireEvent.click(screen.getByRole("button", { name: /kategorie.*svatby|svatby/i }));
    expect(screen.queryByAltText("Portrét jeden")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "filterAll" }));
    expect(screen.getByAltText("Portrét jeden")).toBeInTheDocument();
    expect(screen.getByAltText("Svatba dva")).toBeInTheDocument();
  });

  it("prázdný seznam fotek zobrazí fallback text", () => {
    render(<PortfolioFilter photos={[]} locale="cs" />);
    expect(screen.getByText(/žádné fotky/i)).toBeInTheDocument();
  });

  it("s locale 'en' zobrazí anglické alt texty", () => {
    render(<PortfolioFilter photos={mockPhotos} locale="en" />);
    expect(screen.getByAltText("Portrait one")).toBeInTheDocument();
    expect(screen.getByAltText("Wedding two")).toBeInTheDocument();
  });
});

// =============================================================================
// Lightbox
// =============================================================================
import { Lightbox } from "@/modules/gallery/components/Lightbox";

describe("Lightbox", () => {
  const onClose = vi.fn();
  const onNavigate = vi.fn();

  beforeEach(() => {
    onClose.mockReset();
    onNavigate.mockReset();
  });

  const renderLightbox = (index = 0) =>
    render(
      <Lightbox
        photos={mockPhotos}
        currentIndex={index}
        locale="cs"
        onClose={onClose}
        onNavigate={onNavigate}
      />
    );

  it("renderuje aktuální fotku (alt text)", () => {
    renderLightbox(0);
    expect(screen.getByAltText("Portrét jeden")).toBeInTheDocument();
  });

  it("kliknutí na zavřít zavolá onClose", () => {
    renderLightbox(0);
    fireEvent.click(screen.getByRole("button", { name: /zavřít/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Escape zavolá onClose", () => {
    renderLightbox(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("ArrowRight zavolá onNavigate(currentIndex + 1)", () => {
    renderLightbox(1);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith(2);
  });

  it("ArrowLeft zavolá onNavigate(currentIndex - 1)", () => {
    renderLightbox(1);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onNavigate).toHaveBeenCalledWith(0);
  });

  it("ArrowRight na poslední fotce nepřekročí rozsah", () => {
    renderLightbox(2); // last index
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(onNavigate).toHaveBeenCalledWith(2); // clamp: min(2+1, 2) = 2
  });

  it("ArrowLeft na první fotce nepřekročí rozsah", () => {
    renderLightbox(0);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(onNavigate).toHaveBeenCalledWith(0); // clamp: max(0-1, 0) = 0
  });

  it("na první fotce není tlačítko 'Předchozí'", () => {
    renderLightbox(0);
    expect(screen.queryByRole("button", { name: /předchozí/i })).not.toBeInTheDocument();
  });

  it("na poslední fotce není tlačítko 'Další'", () => {
    renderLightbox(2);
    expect(screen.queryByRole("button", { name: /další/i })).not.toBeInTheDocument();
  });

  it("uprostřed jsou obě navigační tlačítka", () => {
    renderLightbox(1);
    expect(screen.getByRole("button", { name: /předchozí/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /další/i })).toBeInTheDocument();
  });

  it("kliknutí na šipku 'Další' zavolá onNavigate", () => {
    renderLightbox(0);
    fireEvent.click(screen.getByRole("button", { name: /další/i }));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("kliknutí na šipku 'Předchozí' zavolá onNavigate", () => {
    renderLightbox(2);
    fireEvent.click(screen.getByRole("button", { name: /předchozí/i }));
    expect(onNavigate).toHaveBeenCalledWith(1);
  });

  it("s locale 'en' zobrazí anglický alt text", () => {
    render(
      <Lightbox
        photos={mockPhotos}
        currentIndex={0}
        locale="en"
        onClose={onClose}
        onNavigate={onNavigate}
      />
    );
    expect(screen.getByAltText("Portrait one")).toBeInTheDocument();
  });
});
