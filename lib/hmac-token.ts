// Edge-compatible HMAC tokens ve tvaru payload.podpis — bez Node.js specifik

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
  const binary = atob(padded + "====".slice(0, (4 - (str.length % 4)) % 4));
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

export async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await getHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64urlEncode(sig)}`;
}

/** Vrátí ověřený payload, nebo null při neplatném tokenu. */
export async function verifyPayload(token: string, secret: string): Promise<string | null> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  try {
    const key = await getHmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlDecode(sig),
      new TextEncoder().encode(payload)
    );
    return valid ? payload : null;
  } catch {
    return null;
  }
}
