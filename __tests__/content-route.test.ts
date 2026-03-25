import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ isAuthenticated: vi.fn(), signToken: vi.fn() }));
vi.mock("@/lib/content", () => ({
  getContent: vi.fn().mockResolvedValue({}),
  setContent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { isAuthenticated } from "@/lib/auth";
import { GET, POST } from "@/app/api/admin/content/route";

const VALID_DATA = {
  home: { title: "Domů", subtitle: "Podtitulek" },
  "o-mne": { title: "O mně", text: "Popis" },
  sluzby: { title: "Služby", items: [] },
};

function makeGetRequest(locale: string): NextRequest {
  return new NextRequest(`http://localhost/api/admin/content?locale=${locale}`);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/admin/content", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/admin/content — isAllowedLocale", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
  });

  it("povolí locale 'cs'", async () => {
    const res = await GET(makeGetRequest("cs"));
    expect(res.status).toBe(200);
  });

  it("povolí locale 'en'", async () => {
    const res = await GET(makeGetRequest("en"));
    expect(res.status).toBe(200);
  });

  it("odmítne neznámý locale 'de'", async () => {
    const res = await GET(makeGetRequest("de"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid locale");
  });

  it("odmítne prázdný locale", async () => {
    const res = await GET(makeGetRequest(""));
    expect(res.status).toBe(400);
  });

  it("odmítne locale s velkými písmeny ('CS')", async () => {
    const res = await GET(makeGetRequest("CS"));
    expect(res.status).toBe(400);
  });

  it("odmítne locale s SQL injection pokusem", async () => {
    const res = await GET(makeGetRequest("cs; DROP TABLE posts--"));
    expect(res.status).toBe(400);
  });

  it("vrátí 401 pro nepřihlášeného uživatele", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await GET(makeGetRequest("cs"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/content — isValidContentData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAuthenticated).mockResolvedValue(true);
  });

  it("povolí platnou strukturu content dat", async () => {
    const res = await POST(makePostRequest({ locale: "cs", data: VALID_DATA }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("odmítne null jako data", async () => {
    const res = await POST(makePostRequest({ locale: "cs", data: null }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid content structure");
  });

  it("odmítne pole jako data (Array.isArray check)", async () => {
    const res = await POST(makePostRequest({ locale: "cs", data: ["home", "o-mne", "sluzby"] }));
    expect(res.status).toBe(400);
  });

  it("odmítne string jako data", async () => {
    const res = await POST(makePostRequest({ locale: "cs", data: "not an object" }));
    expect(res.status).toBe(400);
  });

  it("odmítne objekt bez klíče 'home'", async () => {
    const { home, ...bez } = VALID_DATA;
    const res = await POST(makePostRequest({ locale: "cs", data: bez }));
    expect(res.status).toBe(400);
  });

  it("odmítne objekt bez klíče 'o-mne'", async () => {
    const data = { home: VALID_DATA.home, sluzby: VALID_DATA.sluzby };
    const res = await POST(makePostRequest({ locale: "cs", data }));
    expect(res.status).toBe(400);
  });

  it("odmítne objekt bez klíče 'sluzby'", async () => {
    const data = { home: VALID_DATA.home, "o-mne": VALID_DATA["o-mne"] };
    const res = await POST(makePostRequest({ locale: "cs", data }));
    expect(res.status).toBe(400);
  });

  it("odmítne objekt kde 'home' je null (!!o.home check)", async () => {
    const res = await POST(makePostRequest({ locale: "cs", data: { ...VALID_DATA, home: null } }));
    expect(res.status).toBe(400);
  });

  it("povolí extra klíče v datech (validace je záměrně permisivní)", async () => {
    const res = await POST(makePostRequest({
      locale: "cs",
      data: { ...VALID_DATA, extra: { foo: "bar" } },
    }));
    expect(res.status).toBe(200);
  });

  it("vrátí 400 pro neplatný locale v POST", async () => {
    const res = await POST(makePostRequest({ locale: "fr", data: VALID_DATA }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid locale");
  });

  it("vrátí 401 pro nepřihlášeného uživatele", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);
    const res = await POST(makePostRequest({ locale: "cs", data: VALID_DATA }));
    expect(res.status).toBe(401);
  });
});
