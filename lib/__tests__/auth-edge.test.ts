import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { signToken, verifyToken } from "@/lib/auth-edge";

const SECRET = "test-secret-that-is-long-enough-32chars";

describe("signToken", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
  });

  it("bez AUTH_SECRET hodí chybu", async () => {
    delete process.env.AUTH_SECRET;
    await expect(signToken()).rejects.toThrow("AUTH_SECRET is not set");
  });

  it("vrátí string formátu 'timestamp.signature'", async () => {
    const token = await signToken();
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(Number(parts[0].split(":")[0])).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(10);
  });
});

describe("verifyToken", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = SECRET;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("platný token (čerstvě podepsaný) projde", async () => {
    const token = await signToken();
    expect(await verifyToken(token)).toBe(true);
  });

  it("token podepsaný jiným secretem neprojde", async () => {
    const token = await signToken();
    process.env.AUTH_SECRET = "jiny-secret-ktery-je-dost-dlouhy-32c";
    expect(await verifyToken(token)).toBe(false);
  });

  it("prázdný string vrátí false", async () => {
    expect(await verifyToken("")).toBe(false);
  });

  it("token bez tečky vrátí false", async () => {
    expect(await verifyToken("tokenBezTecky")).toBe(false);
  });

  it("pozměněná signatura vrátí false", async () => {
    const token = await signToken();
    const dotIdx = token.lastIndexOf(".");
    const tampered = token.slice(0, dotIdx + 1) + "AAAAAAAAAAAAAAAA";
    expect(await verifyToken(tampered)).toBe(false);
  });

  it("pozměněný payload (jiný timestamp) vrátí false", async () => {
    const token = await signToken();
    const dotIdx = token.lastIndexOf(".");
    const sig = token.slice(dotIdx);
    // Validní signatura, ale payload k ní nepatří
    const tampered = "1700000000000" + sig;
    expect(await verifyToken(tampered)).toBe(false);
  });

  it("chybějící AUTH_SECRET vrátí false", async () => {
    const token = await signToken();
    delete process.env.AUTH_SECRET;
    expect(await verifyToken(token)).toBe(false);
  });

  it("expirovaný token (9 hodin starý) vrátí false", async () => {
    vi.useFakeTimers();
    // Podepíšeme token v minulosti (9h zpět)
    vi.setSystemTime(Date.now() - 9 * 60 * 60 * 1000);
    const token = await signToken();
    // Obnovíme reálný čas — verifyToken uvidí timestamp 9h starý
    vi.useRealTimers();
    expect(await verifyToken(token)).toBe(false);
  });

  it("token těsně před expirací (7h 59min) stále projde", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() - (8 * 60 * 60 * 1000 - 60_000)); // 7h59min zpět
    const token = await signToken();
    vi.useRealTimers();
    expect(await verifyToken(token)).toBe(true);
  });
});
