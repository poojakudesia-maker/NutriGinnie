/**
 * Minimal Google OAuth 2.0 "Authorization Code" flow — no NextAuth dependency,
 * so it plugs straight into the existing cookie session (lib/session.ts).
 * Requires a Google Cloud OAuth Client ID/Secret (see README "Google Sign-In setup").
 */

export function isGoogleLoginConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getRedirectUri(): string {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleUserInfo> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) {
    throw new Error(`Fetching Google user info failed (${userRes.status}): ${await userRes.text()}`);
  }
  return (await userRes.json()) as GoogleUserInfo;
}
