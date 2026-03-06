"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminDashboard } from "@/components/AdminDashboard";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

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

const SIG_RESPONSE = {
  signature: "abc123",
  timestamp: 1700000000,
  apiKey: "key123",
  cloudName: "testcloud",
  folder: "portfolio",
  context: "alt_cs=|alt_en=|category=portréty",
};

function mockSigOk() {
  return { ok: true, json: async () => SIG_RESPONSE };
}

function mockUploadOk() {
  return { ok: true, json: async () => ({ public_id: "portfolio/test" }) };
}

describe("AdminDashboard — přímý upload na Cloudinary", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "testcloud";
  });

  it("nejdřív zavolá /api/admin/upload-signature", async () => {
    mockFetch.mockResolvedValueOnce(mockSigOk()).mockResolvedValue(mockUploadOk());
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    expect(mockFetch.mock.calls[0][0]).toBe("/api/admin/upload-signature");
    expect(mockFetch.mock.calls[0][1].method).toBe("POST");
  });

  it("odešle soubor přímo na Cloudinary API URL", async () => {
    mockFetch.mockResolvedValueOnce(mockSigOk()).mockResolvedValue(mockUploadOk());
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(mockFetch.mock.calls[1][0]).toContain("api.cloudinary.com");
    expect(mockFetch.mock.calls[1][0]).toContain("testcloud");
  });

  it("FormData na Cloudinary obsahuje signature a api_key", async () => {
    mockFetch.mockResolvedValueOnce(mockSigOk()).mockResolvedValue(mockUploadOk());
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const body = mockFetch.mock.calls[1][1].body as FormData;
    expect(body.get("signature")).toBe("abc123");
    expect(body.get("api_key")).toBe("key123");
    expect(body.get("folder")).toBe("portfolio");
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("zobrazí ✓ po úspěšném uploadu", async () => {
    mockFetch.mockResolvedValueOnce(mockSigOk()).mockResolvedValue(mockUploadOk());
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(screen.getByText("✓")).toBeInTheDocument());
  });

  it("zobrazí ✗ když Cloudinary vrátí chybu", async () => {
    mockFetch
      .mockResolvedValueOnce(mockSigOk())
      .mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(screen.getByText("✗")).toBeInTheDocument());
  });

  it("zobrazí ✗ když signature endpoint selže", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(screen.getByText("✗")).toBeInTheDocument());
  });

  it("zobrazí ✗ při síťové chybě", async () => {
    mockFetch
      .mockResolvedValueOnce(mockSigOk())
      .mockRejectedValueOnce(new Error("Network error"));
    const user = userEvent.setup();
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), makeFile());
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(screen.getByText("✗")).toBeInTheDocument());
  });

  it("více souborů: signature se volá jednou, Cloudinary upload N-krát", async () => {
    mockFetch.mockResolvedValueOnce(mockSigOk()).mockResolvedValue(mockUploadOk());
    const user = userEvent.setup();
    const files = [makeFile("a.jpg"), makeFile("b.jpg"), makeFile("c.jpg")];
    render(<AdminDashboard photos={[]} />);

    await user.upload(getFileInput(), files);
    await user.click(screen.getByRole("button", { name: /nahrát/i }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(4)); // 1 sig + 3 uploads
    expect(mockFetch.mock.calls[0][0]).toBe("/api/admin/upload-signature");
    expect(mockFetch.mock.calls[1][0]).toContain("api.cloudinary.com");
  });
});
