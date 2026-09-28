import { NextRequest } from "next/server";

/** Verifies the shared-secret Authorization header sent by Vercel Cron / an external scheduler. */
export function isAuthorizedCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
