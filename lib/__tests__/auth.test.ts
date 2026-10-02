import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const { get, cookies, verifyToken, signTokenMock } = vi.hoisted(() => {
  const get = vi.fn();
  return {
    get,
    cookies: vi.fn(async () => ({ get })),
    verifyToken: vi.fn(),
    signTokenMock: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies }));
vi.mock("../auth-edge", () => ({
  COOKIE: "admin_auth",
  verifyToken,
  signToken: signTokenMock,
}));

import { isAuthenticated, authCookieConfig, signToken } from "../auth";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isAuthenticated", () => {
  it("bez cookie vrátí false a neověřuje token", async () => {
    get.mockReturnValue(undefined);
    expect(await isAuthenticated()).toBe(false);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("s prázdnou hodnotou cookie vrátí false a neověřuje token", async () => {
    get.mockReturnValue({ value: "" });
    expect(await isAuthenticated()).toBe(false);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("s platným tokenem vrátí true", async () => {
    get.mockReturnValue({ value: "tok" });
    verifyToken.mockResolvedValue(true);
    expect(await isAuthenticated()).toBe(true);
    expect(get).toHaveBeenCalledWith("admin_auth");
    expect(verifyToken).toHaveBeenCalledWith("tok");
  });

  it("s neplatným tokenem vrátí false", async () => {
    get.mockReturnValue({ value: "bad" });
    verifyToken.mockResolvedValue(false);
    expect(await isAuthenticated()).toBe(false);
  });
});

describe("authCookieConfig", () => {
  it("vrátí očekávanou konfiguraci", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(authCookieConfig("tok")).toEqual({
      name: "admin_auth",
      value: "tok",
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/",
      maxAge: 28800,
    });
  });

  it("v produkci nastaví secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(authCookieConfig("tok").secure).toBe(true);
  });
});

describe("signToken re-export", () => {
  it("je stejná funkce jako v auth-edge", () => {
    expect(signToken).toBe(signTokenMock);
  });
});
