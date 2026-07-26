import { NextResponse } from "next/server";

/** Turns any thrown error into a proper JSON response instead of letting Next.js return a non-JSON 500. */
export function toErrorResponse(err: unknown, fallback: string, status = 500) {
  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status });
}
