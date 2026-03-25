import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("bcryptjs", () => ({ compare: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  signToken: vi.fn().mockResolvedValue("fake.token"),
  authCookieConfig: vi.fn().mockReturnValue({ name: "auth-token", value: "fake.token" }),
}));
vi.mock("@vercel/kv", () => ({
  kv: { incr: vi.fn(), expire: vi.fn() },
}));

import { compare } from "bcryptjs";
import { POST } from "@/app/api/admin/login/route";

function makeRequest(password: unknown, ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": ip },
    body: JSON.stringify({ password }),
  });
}

describe("POST /api/admin/login — validace vstupu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD = "tajne-heslo";
  });

  it("vrátí 401 při neplatném JSON těle", async () => {
    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      body: "{ not valid json",
      headers: { "x-real-ip": "10.0.0.1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("vrátí 401 pokud heslo chybí v těle", async () => {
    const res = await POST(makeRequest(undefined, "10.0.0.2"));
    expect(res.status).toBe(401);
  });

  it("vrátí 401 pokud heslo není string (číslo)", async () => {
    const res = await POST(makeRequest(12345, "10.0.0.3"));
    expect(res.status).toBe(401);
  });

  it("vrátí 401 pokud heslo je prázdný string", async () => {
    const res = await POST(makeRequest("", "10.0.0.4"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/login — plaintext heslo (ADMIN_PASSWORD)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KV_REST_API_URL;
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD = "tajne-heslo";
  });

  it("vrátí 200 při správném hesle", async () => {
    const res = await POST(makeRequest("tajne-heslo", "10.1.0.1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("vrátí 401 při špatném hesle", async () => {
    const res = await POST(makeRequest("spatne-heslo", "10.1.0.2"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/login — bcrypt hash (ADMIN_PASSWORD_HASH)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KV_REST_API_URL;
    process.env.ADMIN_PASSWORD_HASH = "$2a$12$fakehash";
    process.env.ADMIN_PASSWORD = "ignorovano";
  });

  it("vrátí 200 a zavolá bcrypt.compare při správném hesle", async () => {
    vi.mocked(compare).mockResolvedValue(true as never);
    const res = await POST(makeRequest("spravne-heslo", "10.2.0.1"));
    expect(compare).toHaveBeenCalledWith("spravne-heslo", "$2a$12$fakehash");
    expect(res.status).toBe(200);
  });

  it("vrátí 401 a zavolá bcrypt.compare při špatném hesle", async () => {
    vi.mocked(compare).mockResolvedValue(false as never);
    const res = await POST(makeRequest("spatne-heslo", "10.2.0.2"));
    expect(compare).toHaveBeenCalledOnce();
    expect(res.status).toBe(401);
  });

  it("neporovnává plaintext pokud je nastaven hash (přednost hash)", async () => {
    vi.mocked(compare).mockResolvedValue(false as never);
    await POST(makeRequest("ignorovano", "10.2.0.3"));
    // bcrypt.compare byl volán (ne plaintext porovnání)
    expect(compare).toHaveBeenCalledWith("ignorovano", "$2a$12$fakehash");
  });
});

describe("POST /api/admin/login — rate limiting (in-memory bez KV)", () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.ADMIN_PASSWORD = "x";
  });

  it("povolí prvních 5 pokusů ze stejné IP, 6. zablokuje (429)", async () => {
    // Unikátní IP aby jiné testy neovlivnily counter
    const ip = "192.168.99.1";
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest("spatne", ip));
      expect(res.status).toBe(401); // auth fail, ne rate limit
    }
    const res = await POST(makeRequest("spatne", ip));
    expect(res.status).toBe(429);
  });

  it("různé IP adresy mají nezávislé countery", async () => {
    const ip1 = "192.168.99.2";
    const ip2 = "192.168.99.3";
    // Vyčerpej limit pro ip1
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest("spatne", ip1));
    }
    // ip2 stále volná
    const res = await POST(makeRequest("spatne", ip2));
    expect(res.status).toBe(401); // 401, ne 429
  });
});

describe("POST /api/admin/login — extrakce IP z hlaviček", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.ADMIN_PASSWORD_HASH;
    process.env.ADMIN_PASSWORD = "heslo";
  });

  it("čte IP z x-real-ip", async () => {
    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: { "x-real-ip": "203.0.113.1", "Content-Type": "application/json" },
      body: JSON.stringify({ password: "heslo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("fallback na x-forwarded-for pokud x-real-ip chybí (bere první IP)", async () => {
    const req = new Request("http://localhost/api/admin/login", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.2, 10.0.0.1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: "heslo" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
