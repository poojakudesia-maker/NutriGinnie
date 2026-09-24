import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeGoogleCode, isGoogleLoginConfigured } from "@/lib/auth/google";
import { SESSION_COOKIE } from "@/lib/session";

/** GET /api/auth/google/callback — Google redirects here with ?code=... after consent. */
export async function GET(req: NextRequest) {
  if (!isGoogleLoginConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }

  let googleUser;
  try {
    googleUser = await exchangeGoogleCode(code);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(new URL("/login?error=google_failed", req.url));
  }

  if (!googleUser.email_verified) {
    return NextResponse.redirect(new URL("/login?error=google_email_unverified", req.url));
  }

  let user = await prisma.user.findUnique({ where: { googleId: googleUser.sub } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: googleUser.email } });
    if (existingByEmail) {
      // Same verified email as an existing (local) account — link Google to it instead of duplicating.
      user = await prisma.user.update({ where: { id: existingByEmail.id }, data: { googleId: googleUser.sub } });
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          authProvider: "GOOGLE",
          googleId: googleUser.sub,
        },
      });
    }
  }

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
