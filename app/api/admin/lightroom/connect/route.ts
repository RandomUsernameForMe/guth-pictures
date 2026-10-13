import { requireAdmin } from "@/lib/admin-route";
import { NextResponse } from "next/server";

const SCOPES = "openid,AdobeID,offline_access,lr_partner_apis";

export async function GET(): Promise<NextResponse> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const clientId = process.env.ADOBE_CLIENT_ID;
  const redirectUri = process.env.ADOBE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Adobe credentials not configured" }, { status: 500 });
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    response_type: "code",
    state,
  });

  const authUrl = `https://ims-na1.adobelogin.com/ims/authorize/v2?${params.toString()}`;

  const response = NextResponse.redirect(authUrl);
  // Store state in lax cookie — verified in callback to prevent CSRF
  response.cookies.set({
    name: "adobe_oauth_state",
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must be lax so it survives the cross-site redirect back
    path: "/",
    maxAge: 60 * 10, // 10 min
  });
  return response;
}
