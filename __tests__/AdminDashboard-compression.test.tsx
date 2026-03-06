"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import imageCompression from "browser-image-compression";
import { AdminDashboard } from "@/components/AdminDashboard";

vi.mock("browser-image-compression", () => ({
  default: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

// Suppress window.location.reload errors in jsdom
Object.defineProperty(window, "location", {
  writable: true,
  value: { reload: vi.fn() },
});

global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

function makeFile(name = "photo.jpg") {
  return new File([new Uint8Array(100)], name, { type: "image/jpeg" });
}

function getFileInput() {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("AdminDashboard — komprese před uploadem", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
    // Výchozí mock: komprese vrátí soubor beze změny
    vi.mocked(imageCompression).mockResolvedValue(makeFile("compressed.jpg") as unknown as File);
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("zavolá imageCompression se správnými parametry", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(imageCompression).toHaveBeenCalledWith(expect.any(File), {
        maxSizeMB: 3,
        maxWidthOrHeight: 4000,
        useWebWorker: true,
      });
    });
  });

  it("odešle komprimovaný soubor (ne originál) na API", async () => {
    const user = userEvent.setup();
    const compressedFile = new File([new Uint8Array(50)], "compressed.jpg", {
      type: "image/jpeg",
    });
    vi.mocked(imageCompression).mockResolvedValueOnce(compressedFile as unknown as File);

    render(<AdminDashboard photos={[]} />);
    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("file")).toBe(compressedFile);
  });

  it("zobrazí indikátor komprese ('↓') během komprese", async () => {
    let resolveCompression!: (f: File) => void;
    vi.mocked(imageCompression).mockImplementationOnce(
      () => new Promise((resolve) => { resolveCompression = resolve as (f: File) => void; })
    );

    render(<AdminDashboard photos={[]} />);
    const user = userEvent.setup();
    await user.upload(getFileInput(), makeFile());

    // Záměrně nečekáme na dokončení clicku — chceme zachytit mezistav
    user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(screen.getByText("↓")).toBeInTheDocument();
    });

    // Dokončíme kompresi → přejde na upload → hotovo
    resolveCompression(makeFile("done.jpg"));
    await waitFor(() => {
      expect(screen.getByText("✓")).toBeInTheDocument();
    });
  });

  it("zobrazí '✓' po úspěšném uploadu", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile("test.jpg"));
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(screen.getByText("✓")).toBeInTheDocument();
    });
  });

  it("zobrazí '✗' když server vrátí chybu", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<AdminDashboard photos={[]} />);
    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(screen.getByText("✗")).toBeInTheDocument();
    });
  });

  it("zobrazí '✗' když fetch vyhodí výjimku (síťová chyba)", async () => {
    const user = userEvent.setup();
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<AdminDashboard photos={[]} />);
    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(screen.getByText("✗")).toBeInTheDocument();
    });
  });

  it("více souborů: každý se komprimuje zvlášť", async () => {
    const user = userEvent.setup();
    const files = [makeFile("a.jpg"), makeFile("b.jpg"), makeFile("c.jpg")];

    render(<AdminDashboard photos={[]} />);
    await user.upload(getFileInput(), files);
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => {
      expect(imageCompression).toHaveBeenCalledTimes(3);
    });
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
