"use client";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditorialImageEditor } from "@/modules/admin/components/EditorialImageEditor";
import type { EditorialImage, EditorialImages } from "@/modules/admin/lib/content";

const emptyImage = (): EditorialImage => ({
  publicId: "",
  alt: { cs: "", en: "" },
  focal: { desktop: "50% 50%", mobile: "50% 50%" },
});

const editorial = (): EditorialImages => ({
  home: { hero: emptyImage(), stories: [emptyImage(), emptyImage(), emptyImage()], photographer: emptyImage(), tools: { foceni101: emptyImage(), lightPlanner: emptyImage() } },
  portrait: { hero: emptyImage(), gallery: [emptyImage(), emptyImage(), emptyImage()] },
  business: { hero: emptyImage(), headshots: [emptyImage(), emptyImage(), emptyImage()], atWork: [emptyImage(), emptyImage(), emptyImage()] },
  events: { hero: emptyImage(), reportage: [emptyImage(), emptyImage(), emptyImage(), emptyImage()] },
});

describe("EditorialImageEditor", () => {
  it("přiřadí galerijní fotku do slotu a uloží celý editorial", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<EditorialImageEditor editorial={editorial()} photos={[{
      publicId: "portfolio/event",
      width: 1200,
      height: 800,
      alt: { cs: "Atmosféra eventu", en: "Event atmosphere" },
      category: "svatby",
    }]} />);

    await user.click(screen.getByRole("button", { name: "Změnit fotku: Eventy — hero" }));
    await user.click(screen.getByRole("button", { name: "Vybrat Atmosféra eventu" }));
    await user.click(screen.getByRole("button", { name: "Uložit editorialové fotky" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/images", expect.objectContaining({ method: "POST" })));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.editorial.events.hero).toMatchObject({
      publicId: "portfolio/event",
      alt: { cs: "Atmosféra eventu", en: "Event atmosphere" },
    });
  });
});
