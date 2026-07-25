import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "nutriping_user_id";

/** Reads the current user id from the session cookie (server components / route handlers). */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/** Loads the full current-user record for server components. Null if no session or user was deleted. */
export async function getCurrentUser() {
  const id = await getCurrentUserId();
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}
