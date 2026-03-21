// Edge-compatible auth helpers — bez Node.js specifik, funguje v middleware i API routes

export const COOKIE = "admin_auth";
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) str += String.fromCharCode(byte);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64urlDecode(str: string): Uint8Array<ArrayBuffer> {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "====".slice(0, (4 - str.length % 4) % 4));
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export async function signToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  const payload = `${Date.now()}:${crypto.randomUUID()}`;
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64urlEncode(sig)}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const timestamp = parseInt(payload.split(":")[0], 10);
  if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_MAX_AGE_MS) return false;
  try {
    const key = await getHmacKey(secret);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sig),
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}
