import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorialNav } from "../EditorialNav";

vi.mock("next-intl", () => ({ useLocale: () => "cs" }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
}));

describe("EditorialNav", () => {
  it("links all service worlds and marks the active page", () => {
    render(<EditorialNav tone="light" active="business" />);
    expect(screen.getByRole("link", { name: "Guth Pictures" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Portréty" })).toHaveAttribute("href", "/sluzby/portretni-foceni");
    expect(screen.getByRole("link", { name: "Business" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Eventy a svatby" })).toHaveAttribute("href", "/sluzby/eventy-a-svatby");
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/#kontakt");
  });

  it("shows the secondary site links on content pages", () => {
    render(<EditorialNav tone="light" active="about" />);

    expect(screen.getByRole("link", { name: "Služby" })).toHaveAttribute("href", "/sluzby");
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute("href", "/portfolio");
    expect(screen.getByRole("link", { name: "O mně" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("href", "/blog");
  });
});
