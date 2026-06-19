import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/image", () => ({
  default: ({ src, alt, fill, sizes, placeholder, blurDataURL, ...rest }: {
    src: string; alt: string; fill?: boolean; sizes?: string;
    placeholder?: string; blurDataURL?: string; [key: string]: unknown;
  }) => <img src={src} alt={alt} {...rest} />,
}));

import { Testimonials } from "@/modules/homepage/components/Testimonials";
import type { Testimonial } from "@/modules/admin/lib/content";

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
});

const withPhoto: Testimonial = { id: "1", quote: "Skvělé focení", author: "Jana", role: "Svatba", photo: "site/jana" };
const noPhoto: Testimonial = { id: "2", quote: "Doporučuji", author: "Petr" };

describe("Testimonials", () => {
  it("renders nothing when the list is empty", () => {
    const { container } = render(
      <Testimonials testimonials={[]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders quote and author", () => {
    render(
      <Testimonials testimonials={[noPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(screen.getByText("Doporučuji")).toBeInTheDocument();
    expect(screen.getByText("Petr")).toBeInTheDocument();
  });

  it("renders an avatar image only when photo is set", () => {
    render(
      <Testimonials testimonials={[withPhoto, noPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("alt", "Jana");
  });

  it("renders role only when present", () => {
    const { rerender } = render(
      <Testimonials testimonials={[withPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(screen.getByText("Svatba")).toBeInTheDocument();

    rerender(
      <Testimonials testimonials={[noPhoto]} locale="cs" eyebrow="Reference" title="Co říkají klienti" />
    );
    expect(screen.queryByText("Svatba")).not.toBeInTheDocument();
  });
});
