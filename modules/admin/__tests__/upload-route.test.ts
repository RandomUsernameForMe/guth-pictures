import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(), signToken: vi.fn() }));
vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      // Simuluje upload_stream: zavolá callback ihned při .end()
      upload_stream: vi.fn(
        (_opts: unknown, cb: (err: null, res: { public_id: string }) => void) => ({
          end: () => cb(null, { public_id: "portfolio/test123" }),
        })
      ),
    },
  },
}));

import { isAuthenticated } from "@/lib/auth";
import { POST } from "@/app/api/admin/upload/route";

/**
 * jsdom's Blob.arrayBuffer() není implementováno — proto subclassujeme File
 * a přidáme vlastní arrayBuffer().
 */
class TestFile extends File {
  private readonly _bytes: Uint8Array;
  constructor(bytes: Uint8Array) {
    super([bytes as Uint8Array<ArrayBuffer>], "test.bin", { type: "application/octet-stream" });
    this._bytes = bytes;
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    return this._bytes.buffer as ArrayBuffer;
  }
}

/**
 * Vytvoří Request s mocknutou formData().
 * jsdom's File není kompatibilní s undici WebIDL při FormData.append —
 * proto mockujeme formData() přímo a vracíme TestFile přes fakeFormData.get().
 */
function makeUploadRequest(fileBytes: number[] | null, extras: Record<string, string> = {}): Request {
  const file = fileBytes !== null
    ? new TestFile(new Uint8Array(fileBytes))
    : null;

  const fakeFormData = {
    get: (key: string) => {
      if (key === "file") return file;
      return extras[key] ?? null;
    },
  };

  const req = new Request("http://localhost/api/admin/upload", {
    method: "POST",
    body: "x",
  });
  Object.defineProperty(req, "formData", { value: async () => fakeFormData });
  return req;
}

describe("POST /api/admin/upload — autentizace", () => {
  it("vrátí 401 pro nepřihlášeného uživatele", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await POST(makeUploadRequest([0xff, 0xd8, 0xff]));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/upload — validace souboru", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
  });

  it("vrátí 400 pokud soubor chybí ve FormData", async () => {
    const res = await POST(makeUploadRequest(null));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("No file provided");
  });
});

describe("POST /api/admin/upload — detekce MIME typu z magic bytes", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
  });

  it("povolí JPEG (magic bytes FF D8 FF)", async () => {
    const res = await POST(makeUploadRequest([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));
    expect(res.status).toBe(200);
  });

  it("povolí PNG (magic bytes 89 50 4E 47)", async () => {
    const res = await POST(makeUploadRequest([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(res.status).toBe(200);
  });

  it("povolí WebP (RIFF na pozici 0–3, WEBP na pozici 8–11)", async () => {
    const bytes = new Array(12).fill(0);
    bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // RIFF
    bytes[8] = 0x57; bytes[9] = 0x45; bytes[10] = 0x42; bytes[11] = 0x50; // WEBP
    const res = await POST(makeUploadRequest(bytes));
    expect(res.status).toBe(200);
  });

  it("povolí GIF (magic bytes 47 49 46 38 = GIF8)", async () => {
    const res = await POST(makeUploadRequest([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])); // GIF89a
    expect(res.status).toBe(200);
  });

  it("odmítne soubor s PDF magic bytes (%PDF)", async () => {
    const res = await POST(makeUploadRequest([0x25, 0x50, 0x44, 0x46, 0x2d])); // %PDF-
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid file type");
  });

  it("odmítne prázdný soubor (žádné magic bytes)", async () => {
    const res = await POST(makeUploadRequest([]));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid file type");
  });

  it("odmítne RIFF soubor který není WebP (RIFF+WAVE)", async () => {
    // RIFF header ale WAVE místo WEBP
    const bytes = new Array(12).fill(0);
    bytes[0] = 0x52; bytes[1] = 0x49; bytes[2] = 0x46; bytes[3] = 0x46; // RIFF
    bytes[8] = 0x57; bytes[9] = 0x41; bytes[10] = 0x56; bytes[11] = 0x45; // WAVE
    const res = await POST(makeUploadRequest(bytes));
    expect(res.status).toBe(400);
  });

  it("odmítne soubor s pouze 3 byty (příliš krátký pro WebP detekci)", async () => {
    // 3 byty nestačí pro WebP (potřebuje 12), ale taky nesedí na JPEG/PNG
    const res = await POST(makeUploadRequest([0x52, 0x49, 0x46])); // Jen RIF, bez posledního F
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/upload — úspěšný upload", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
  });

  it("vrátí publicId z Cloudinary", async () => {
    const res = await POST(makeUploadRequest([0xff, 0xd8, 0xff, 0xe0], {
      alt_cs: "Fotka ze svatby",
      alt_en: "Wedding photo",
      category: "svatby",
    }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ publicId: "portfolio/test123" });
  });
});
