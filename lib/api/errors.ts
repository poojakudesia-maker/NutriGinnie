import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Turns any thrown error into a proper JSON response instead of letting
 * Next.js return a non-JSON 500. Prisma errors (e.g. a stale client after a
 * schema change, "Unknown argument ...") come with a multi-line, code-context
 * formatted message that's useless — and alarming — to show a user, so those
 * are logged in full server-side and replaced with a short generic message.
 */
export function toErrorResponse(err: unknown, fallback: string, status = 500) {
  if (isPrismaError(err)) {
    console.error("Prisma error:", err);
    return NextResponse.json(
      {
        error:
          "A database error occurred while saving. If this keeps happening, the app's database schema may be out of date — run `npx prisma generate` and restart the server.",
      },
      { status: 500 }
    );
  }

  const message = err instanceof Error ? err.message : fallback;
  return NextResponse.json({ error: message || fallback }, { status });
}

function isPrismaError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientInitializationError
  );
}
