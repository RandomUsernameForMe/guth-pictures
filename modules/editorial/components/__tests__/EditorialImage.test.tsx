import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialImageView } from "../EditorialImage";
import type { EditorialImage } from "@/modules/admin/lib/content";

const filled: EditorialImage = {
  publicId: "portfolio/portrait",
  alt: { cs: "Český portrét", en: "English portrait" },
  focal: { desktop: "40% 30%", mobile: "60% 50%" },
};

describe("EditorialImageView", () => {
  it("renders localized managed image with focal variables", () => {
    render(<EditorialImageView image={filled} locale="cs" sizes="100vw" />);
    const image = screen.getByAltText("Český portrét");
    expect(decodeURIComponent(image.getAttribute("src") ?? "")).toContain("portfolio/portrait");
    expect(image).toHaveStyle({ "--focus-desktop": "40% 30%", "--focus-mobile": "60% 50%" });
  });

  it("renders a stable labelled placeholder for an empty slot", () => {
    render(<EditorialImageView image={{ ...filled, publicId: "" }} locale="en" sizes="100vw" placeholderLabel="Photo coming soon" />);
    expect(screen.getByRole("img", { name: "Photo coming soon" })).toBeInTheDocument();
  });
});
