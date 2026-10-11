"use client";

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContentEditor } from "@/modules/admin/components/ContentEditor";
import type { ContentData } from "@/modules/admin/lib/content";
import { defaultPageCopy } from "@/modules/admin/lib/page-copy";

const router = { push: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const service = (title: string) => ({ title, desc: `${title} popis`, packages: [], note: "" });

const content = (): ContentData => ({
  home: { title: "Home", subtitle: "Sub" },
  "o-mne": { title: "O mně", subtitle: "", bio: "" },
  lightTesterPromo: { title: "", desc: "" },
  editorial: { eventsTitle: "" },
  pages: defaultPageCopy("cs"),
  sluzby: {
    portraits: service("Portréty původní"),
    weddings: service("Svatby původní"),
    business: { ...service("Firmy původní"), extras: [] },
  },
  testimonials: [],
});

describe("ContentEditor", () => {
  it("upraví nadpis v sekci Portréty a odešle celý obsah", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
      if (init?.method === "POST") return json({ ok: true });
      if (url.startsWith("/api/admin/content")) return json(content());
      if (url === "/api/admin/images") return json({ profile: "" });
      if (url === "/api/admin/email") return json({ email: "a@b.cz" });
      throw new Error(`unexpected ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(<ContentEditor />);

    const heading = await screen.findByRole("heading", { level: 3, name: "Portréty" });
    const section = heading.closest("div")!.parentElement!;
    const field = await within(section).findByDisplayValue("Portréty původní");
    await user.clear(field);
    await user.type(field, "Nový nadpis");
    await user.click(screen.getByRole("button", { name: "Uložit" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/content", expect.objectContaining({ method: "POST" })),
    );
    const call = fetchMock.mock.calls.find(([u, i]) => u === "/api/admin/content" && i?.method === "POST")!;
    const body = JSON.parse(call[1]!.body as string);
    expect(body.locale).toBe("cs");
    expect(body.data.sluzby.portraits.title).toBe("Nový nadpis");
    expect(body.data.sluzby.weddings.title).toBe("Svatby původní");
    expect(body.data.sluzby.business.title).toBe("Firmy původní");
    expect(body.data.testimonials).toEqual([]);
  });
});
