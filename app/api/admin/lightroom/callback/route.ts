import { saveInitialTokens, getCatalogId } from "@/modules/gallery/lib/lightroom";
import { NextRequest, NextResponse } from "next/server";

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/galerie?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/galerie?error=no_code", request.url));
  }

  // Verify state to prevent CSRF
  const storedState = request.cookies.get("adobe_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/admin/galerie?error=invalid_state", request.url));
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: process.env.ADOBE_CLIENT_ID!,
    client_secret: process.env.ADOBE_CLIENT_SECRET!,
    redirect_uri: process.env.ADOBE_REDIRECT_URI!,
  });

  const tokenRes = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[lightroom/callback] token exchange failed:", err);
    return NextResponse.redirect(
      new URL("/admin/galerie?error=token_exchange_failed", request.url)
    );
  }

  const tokens = await tokenRes.json();

  await saveInitialTokens(
    tokens.access_token,
    tokens.refresh_token,
    tokens.expires_in ?? 86400
  );

  // Verify connection works
  try {
    await getCatalogId();
  } catch (e) {
    console.error("[lightroom/callback] catalog fetch failed:", e);
    return NextResponse.redirect(
      new URL("/admin/galerie?error=catalog_fetch_failed", request.url)
    );
  }

  const response = NextResponse.redirect(new URL("/admin/galerie?connected=1", request.url));
  // Clear state cookie
  response.cookies.set({ name: "adobe_oauth_state", value: "", maxAge: 0, path: "/" });
  return response;
}
