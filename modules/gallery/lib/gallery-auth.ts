// Edge-compatible gallery session tokens
import { signPayload, verifyPayload } from "@/lib/hmac-token";

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "fallback-dev-secret";
}

export function galleryCookieName(slug: string): string {
  return `gallery-session-${slug}`;
}

export async function signGalleryToken(slug: string): Promise<string> {
  return signPayload(`${slug}:${Date.now()}:${crypto.randomUUID()}`, getSecret());
}

export async function verifyGalleryToken(
  token: string,
  slug: string,
  notBefore = 0
): Promise<boolean> {
  const payload = await verifyPayload(token, getSecret());
  if (payload === null) return false;
  // Payload format: {slug}:{timestamp}:{uuid}
  const [tokenSlug, timestamp] = payload.split(":");
  return tokenSlug === slug && Number(timestamp) >= notBefore;
}
