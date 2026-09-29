import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditorialSubpage } from "../EditorialSubpage";

vi.mock("next-intl", () => ({ useLocale: () => "cs" }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: React.PropsWithChildren<{ href: string }>) => <a href={href} {...props}>{children}</a>,
}));

describe("EditorialSubpage", () => {
  it("renders the light editorial shell with secondary navigation", () => {
    render(<EditorialSubpage active="portfolio"><h1>Portfolio</h1></EditorialSubpage>);

    expect(screen.getByRole("main")).toHaveClass("editorial-secondary");
    expect(screen.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Portfolio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "O mně" })).toHaveAttribute("href", "/o-mne");
  });
});
