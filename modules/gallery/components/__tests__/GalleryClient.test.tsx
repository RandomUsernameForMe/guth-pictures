import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GalleryClient } from "@/modules/gallery/components/GalleryClient";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

const photos = [
  { lrId: "a", cloudinaryId: "a", filename: "a.jpg", width: 1, height: 1 },
  { lrId: "b", cloudinaryId: "b", filename: "b.jpg", width: 1, height: 1 },
];

function mockFetch(post: () => Promise<{ ok: boolean; status: number }>) {
  global.fetch = vi.fn((url: string, init?: RequestInit) => {
    if (init?.method === "POST") return post();
    const body = url.endsWith("/photos") ? { photos } : { selection: null };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }) as unknown as typeof fetch;
}

describe("GalleryClient ukládání výběru", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("při 410 zobrazí chybu a ne „Uloženo“", async () => {
    mockFetch(() => Promise.resolve({ ok: false, status: 410 }));
    render(<GalleryClient slug="x" />);
    const save = (await screen.findAllByText("Uložit výběr"))[0];
    await userEvent.click(save);
    expect((await screen.findByRole("alert")).textContent).toMatch(/vypršela/);
    expect(screen.queryByText(/Uloženo/)).toBeNull();
  });

  it("změna výběru během ukládání neukáže „Uloženo“", async () => {
    let resolvePost: (v: { ok: boolean; status: number }) => void = () => {};
    mockFetch(() => new Promise((r) => (resolvePost = r)));
    render(<GalleryClient slug="x" />);
    const save = (await screen.findAllByText("Uložit výběr"))[0];
    await userEvent.click(save);
    await userEvent.click(screen.getAllByLabelText("Přidat do výběru")[0]);
    resolvePost({ ok: true, status: 200 });
    await waitFor(() => expect(screen.queryByText("Ukládám…")).toBeNull());
    expect(screen.queryByText(/Uloženo/)).toBeNull();
  });
});
