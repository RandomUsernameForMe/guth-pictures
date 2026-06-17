// Edge-compatible proposal session tokens — same HMAC pattern as gallery-auth.ts.

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

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET ?? "fallback-dev-secret";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function proposalCookieName(slug: string): string {
  return `proposal-session-${slug}`;
}

export async function signProposalToken(slug: string): Promise<string> {
  const payload = `${slug}:${Date.now()}:${crypto.randomUUID()}`;
  const key = await getHmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${base64urlEncode(sig)}`;
}

export async function verifyProposalToken(token: string, slug: string): Promise<boolean> {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  // Payload format: {slug}:{timestamp}:{uuid}
  const [tokenSlug] = payload.split(":");
  if (tokenSlug !== slug) return false;
  try {
    const key = await getHmacKey();
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
