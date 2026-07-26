import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, isGoogleLoginConfigured } from "@/lib/auth/google";

/** GET /api/auth/google — redirects to Google's OAuth consent screen. */
export async function GET(req: NextRequest) {
  if (!isGoogleLoginConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }
  return NextResponse.redirect(getGoogleAuthUrl());
}
