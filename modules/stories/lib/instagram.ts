import "server-only";
import { getKv } from "@/lib/kv";

const GRAPH = "https://graph.facebook.com/v23.0";
const AUTH_KEY = "stories:igAuth";
const REFRESH_BEFORE_DAYS = 10;

type IgAuth = { accessToken: string; expiresAt: string };

async function getStoredAuth(): Promise<IgAuth | null> {
  const kv = await getKv();
  if (!kv) return null;
  return await kv.get<IgAuth>(AUTH_KEY);
}

async function getToken(): Promise<string> {
  const stored = await getStoredAuth();
  if (stored) return stored.accessToken;
  const env = process.env.IG_ACCESS_TOKEN;
  if (!env) throw new Error("IG_ACCESS_TOKEN not configured");
  return env;
}

async function graphJson(res: Response): Promise<Record<string, unknown>> {
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Instagram API: unexpected response (${res.status})`);
  }
  if (!res.ok || json.error) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? JSON.stringify(json);
    throw new Error(`Instagram API: ${msg}`);
  }
  return json;
}

/** Publikuje video jako IG story. Vrací media id. */
export async function publishStory(
  videoUrl: string,
  opts: { pollIntervalMs?: number; maxPolls?: number } = {},
): Promise<string> {
  const { pollIntervalMs = 5000, maxPolls = 24 } = opts;
  const userId = process.env.IG_USER_ID;
  if (!userId) throw new Error("IG_USER_ID not configured");
  const token = await getToken();

  const created = await graphJson(await fetch(`${GRAPH}/${userId}/media`, {
    method: "POST",
    body: new URLSearchParams({ media_type: "STORIES", video_url: videoUrl, access_token: token }),
  }));
  const creationId = created.id as string;

  let finished = false;
  for (let i = 0; i < maxPolls; i++) {
    const status = await graphJson(await fetch(
      `${GRAPH}/${creationId}?fields=status_code`,
      { headers: { Authorization: `Bearer ${token}` } },
    ));
    if (status.status_code === "FINISHED") { finished = true; break; }
    if (status.status_code === "ERROR") throw new Error("Instagram API: container processing failed");
    await new Promise(r => setTimeout(r, pollIntervalMs));
  }
  if (!finished) throw new Error("Instagram API: container processing timed out");

  const published = await graphJson(await fetch(`${GRAPH}/${userId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: creationId, access_token: token }),
  }));
  return published.id as string;
}

/** Obnoví dlouhodobý token, když zbývá <10 dní. Nový token jde do KV. */
export async function refreshTokenIfNeeded(now = new Date()): Promise<void> {
  const stored = await getStoredAuth();
  const expiresAt = stored ? new Date(stored.expiresAt) : new Date(0); // env seed: expiraci neznáme → refreshni hned
  const daysLeft = (expiresAt.getTime() - now.getTime()) / (24 * 3600 * 1000);
  if (daysLeft > REFRESH_BEFORE_DAYS) return;

  const { FB_APP_ID, FB_APP_SECRET } = process.env;
  if (!FB_APP_ID || !FB_APP_SECRET) throw new Error("FB_APP_ID/FB_APP_SECRET not configured");
  const current = await getToken();

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: current,
  });
  const json = await graphJson(await fetch(`${GRAPH}/oauth/access_token`, { method: "POST", body: params }));

  const kv = await getKv();
  if (!kv) throw new Error("KV not configured");
  const expiresIn = (json.expires_in as number | undefined) ?? 60 * 24 * 3600;
  await kv.set(AUTH_KEY, {
    accessToken: json.access_token as string,
    expiresAt: new Date(now.getTime() + expiresIn * 1000).toISOString(),
  } satisfies IgAuth);
}
