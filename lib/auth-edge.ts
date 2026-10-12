// Edge-compatible auth helpers — bez Node.js specifik, funguje v middleware i API routes
import { signPayload, verifyPayload } from "./hmac-token";

export const COOKIE = "admin_auth";
const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000;

export async function signToken(): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return signPayload(`${Date.now()}:${crypto.randomUUID()}`, secret);
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) return false;
  const payload = await verifyPayload(token, secret);
  if (payload === null) return false;
  const timestamp = parseInt(payload.split(":")[0], 10);
  return !isNaN(timestamp) && Date.now() - timestamp <= TOKEN_MAX_AGE_MS;
}
