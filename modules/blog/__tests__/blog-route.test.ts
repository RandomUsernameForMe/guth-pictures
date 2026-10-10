import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(), signToken: vi.fn() }));
vi.mock("@/modules/blog/lib/blog", () => ({
  getBlogPosts: vi.fn().mockResolvedValue([]),
  saveBlogPost: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { isAuthenticated } from "@/lib/auth";
import { saveBlogPost } from "@/modules/blog/lib/blog";
import { GET, POST } from "@/app/api/admin/blog/route";

const VALID_UUID = "11111111-1111-1111-1111-111111111111";
const VALID_POST: {
  id: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
  published: boolean;
  cs: { title: string; excerpt: string; content: string };
  en: { title: string; excerpt: string; content: string };
  coverImage?: string;
} = {
  id: VALID_UUID,
  slug: "test-post",
  publishedAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  published: true,
  cs: { title: "Titulek", excerpt: "Ukázka", content: "Obsah" },
  en: { title: "Title", excerpt: "Excerpt", content: "Content" },
};

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/blog", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/admin/blog", () => {
  it("vrátí 401 pro nepřihlášeného uživatele", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("vrátí 200 a seznam postů pro přihlášeného", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/blog — autentizace", () => {
  it("vrátí 401 pro nepřihlášeného uživatele", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await POST(makePostRequest(VALID_POST));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/blog — validace id (UUID)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(saveBlogPost).mockResolvedValue({ ok: true });
  });

  it("vrátí 200 pro platný post", async () => {
    const res = await POST(makePostRequest(VALID_POST));
    expect(res.status).toBe(200);
    expect(saveBlogPost).toHaveBeenCalledOnce();
  });

  it("vrátí 400 pro chybějící id", async () => {
    const { id, ...bez } = VALID_POST;
    const res = await POST(makePostRequest(bez));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid id");
  });

  it("vrátí 400 pro id v nesprávném formátu (ne UUID)", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, id: "neplatne-id-123" }));
    expect(res.status).toBe(400);
  });

  it("vrátí 400 pro prázdné id", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, id: "" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/blog — validace slug", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(saveBlogPost).mockResolvedValue({ ok: true });
  });

  it("vrátí 400 pro slug s velkými písmeny", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, slug: "Test-Post" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid slug");
  });

  it("vrátí 400 pro slug s podtržítky", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, slug: "test_post" }));
    expect(res.status).toBe(400);
  });

  it("vrátí 400 pro prázdný slug", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, slug: "" }));
    expect(res.status).toBe(400);
  });

  it("povolí slug s pomlčkami a čísly", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, slug: "muj-post-2024" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/blog — validace locale titles", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(saveBlogPost).mockResolvedValue({ ok: true });
  });

  it("vrátí 400 pokud cs.title chybí", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, title: "" },
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing locale title");
  });

  it("vrátí 400 pokud en.title chybí", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      en: { ...VALID_POST.en, title: "" },
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing locale title");
  });

  it("vrátí 400 pro titulek delší než 200 znaků", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, title: "a".repeat(201) },
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Title too long");
  });

  it("povolí titulek přesně 200 znaků (hraniční hodnota)", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, title: "a".repeat(200) },
    }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/blog — validace excerpt a content", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(saveBlogPost).mockResolvedValue({ ok: true });
  });

  it("vrátí 400 pro excerpt delší než 500 znaků", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, excerpt: "a".repeat(501) },
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Excerpt too long");
  });

  it("povolí excerpt přesně 500 znaků (hraniční hodnota)", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, excerpt: "a".repeat(500) },
    }));
    expect(res.status).toBe(200);
  });

  it("vrátí 400 pro content delší než 50000 znaků", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, content: "a".repeat(50001) },
    }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Content too long");
  });

  it("povolí content přesně 50000 znaků (hraniční hodnota)", async () => {
    const res = await POST(makePostRequest({
      ...VALID_POST,
      cs: { ...VALID_POST.cs, content: "a".repeat(50000) },
    }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/blog — validace coverImage", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(saveBlogPost).mockResolvedValue({ ok: true });
  });

  it("vrátí 400 pro coverImage se speciálními znaky (@)", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, coverImage: "folder/image@2x" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid coverImage");
  });

  it("povolí coverImage s lomítky, pomlčkami a tečkami", async () => {
    const res = await POST(makePostRequest({ ...VALID_POST, coverImage: "portfolio/2024-wedding.jpg" }));
    expect(res.status).toBe(200);
  });

  it("povolí post bez coverImage (volitelné pole)", async () => {
    const { coverImage, ...bez } = VALID_POST;
    const res = await POST(makePostRequest(bez));
    expect(res.status).toBe(200);
  });
});
