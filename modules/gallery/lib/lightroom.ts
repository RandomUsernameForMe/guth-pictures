import "server-only";
import { getKv } from "@/lib/kv";

const LR_BASE = "https://lr.adobe.io";
const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";

interface AdobeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
}

export interface LightroomAlbum {
  id: string;
  name: string;
  subtype: string;
  assetCount?: number;
}

export interface LightroomAsset {
  id: string;
  filename: string;
  width: number;
  height: number;
  captureDate?: string;
  keywords: string[];
}

async function saveTokens(tokens: AdobeTokens): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("KV unavailable");
  await kv.set("adobe:tokens", tokens);
}

export async function getTokens(): Promise<AdobeTokens | null> {
  const kv = await getKv();
  if (!kv) return null;
  return kv.get<AdobeTokens>("adobe:tokens");
}

export async function saveInitialTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  await saveTokens({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000 - 60_000, // 1min buffer
  });
}

async function refreshAccessToken(): Promise<string> {
  const stored = await getTokens();
  if (!stored?.refreshToken) throw new Error("No refresh token stored");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: stored.refreshToken,
    client_id: process.env.ADOBE_CLIENT_ID!,
    client_secret: process.env.ADOBE_CLIENT_SECRET!,
  });

  const res = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  const data = await res.json();
  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? stored.refreshToken,
    expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000 - 60_000,
  });

  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  const stored = await getTokens();
  if (!stored) throw new Error("Lightroom not connected");
  if (Date.now() < stored.expiresAt) return stored.accessToken;
  return refreshAccessToken();
}

async function lrFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`${LR_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-API-Key": process.env.ADOBE_CLIENT_ID!,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  // Adobe prefixes JSON responses with "while (1) {}" as XSSI protection — strip it
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/json")) return res;
  const text = await res.text();
  const stripped = text.replace(/^while\s*\(\s*1\s*\)\s*\{\s*\}\s*/, "").trimStart();
  return new Response(stripped, {
    status: res.status,
    headers: res.headers,
  });
}

export async function getCatalogId(): Promise<string> {
  const res = await lrFetch("/v2/catalog");
  if (!res.ok) throw new Error(`Failed to get catalog: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function listAlbums(catalogId: string): Promise<LightroomAlbum[]> {
  const res = await lrFetch(`/v2/catalogs/${catalogId}/albums?limit=100`);
  if (!res.ok) throw new Error(`Failed to list albums: ${res.status}`);
  const data = await res.json();
  return (data.resources ?? []).map((r: Record<string, unknown>) => {
    const payload = r.payload as Record<string, unknown> | undefined;
    return {
      id: r.id as string,
      name: (payload?.name as string) ?? "Unnamed",
      subtype: (payload?.subtype as string) ?? "project",
    };
  });
}

export async function getAlbumAssets(
  catalogId: string,
  albumId: string
): Promise<LightroomAsset[]> {
  const assets: LightroomAsset[] = [];
  let href: string | null = `/v2/catalogs/${catalogId}/albums/${albumId}/assets?limit=100`;

  while (href) {
    const res = await lrFetch(href);
    if (!res.ok) throw new Error(`Failed to get assets: ${res.status}`);
    const data = await res.json();

    for (const r of data.resources ?? []) {
      // r.id = album-asset relationship ID, r.asset.id = actual asset ID needed for renditions
      const assetObj = r.asset as Record<string, unknown> | undefined;
      const assetId = (assetObj?.id as string) ?? (r.id as string);
      const payload = r.payload as Record<string, unknown> | undefined;

      assets.push({
        id: assetId,
        filename: `${assetId}.jpg`,
        width: 0,
        height: 0,
        captureDate: payload?.userUpdated as string | undefined,
        keywords: [],
      });
    }

    const next = (data.links as Record<string, unknown>)?.next as
      | Record<string, unknown>
      | undefined;
    href = (next?.href as string) ?? null;
  }

  return assets;
}

export async function getAssetRenditionStream(
  catalogId: string,
  assetId: string,
  size: "2048" | "1280" | "640" = "2048"
): Promise<ReadableStream<Uint8Array>> {
  const res = await lrFetch(`/v2/catalogs/${catalogId}/assets/${assetId}/renditions/${size}`);
  if (!res.ok) throw new Error(`Failed to get rendition for ${assetId}: ${res.status}`);
  if (!res.body) throw new Error(`No body for rendition ${assetId}`);
  return res.body;
}

export async function addKeywordToAsset(
  catalogId: string,
  assetId: string,
  keyword: string
): Promise<void> {
  // First fetch existing keywords to merge
  const res = await lrFetch(`/v2/catalogs/${catalogId}/assets/${assetId}`);
  if (!res.ok) throw new Error(`Failed to get asset ${assetId}: ${res.status}`);
  const data = await res.json();

  const asset = data.asset as Record<string, unknown> | undefined;
  const payload = asset?.payload as Record<string, unknown> | undefined;
  const xmp = payload?.xmp as Record<string, unknown> | undefined;
  const dc = xmp?.dc as Record<string, unknown> | undefined;
  const existingKeywords: string[] = (dc?.subject as string[]) ?? [];

  if (existingKeywords.includes(keyword)) return; // already tagged

  const putRes = await lrFetch(`/v2/catalogs/${catalogId}/assets/${assetId}`, {
    method: "PUT",
    body: JSON.stringify({
      subtype: "image",
      payload: {
        xmp: {
          dc: {
            subject: [...existingKeywords, keyword],
          },
        },
      },
    }),
  });

  if (!putRes.ok) {
    const err = await putRes.text();
    throw new Error(`Failed to tag asset ${assetId}: ${err}`);
  }
}
