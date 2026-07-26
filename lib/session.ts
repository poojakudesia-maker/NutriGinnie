import { cookies } from "next/headers";
import type { User } from "@prisma/client";
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

/**
 * True once the health/food profile has been filled in. A brand-new
 * Google-authenticated account has a User row (email + name only) but
 * none of these yet, so every calculation-dependent screen must gate on
 * this before rendering.
 */
export function isProfileComplete(
  user: Pick<User, "age" | "gender" | "heightCm" | "weightKg" | "targetWeightKg" | "activityLevel">
): boolean {
  return (
    user.age != null &&
    user.gender != null &&
    user.heightCm != null &&
    user.weightKg != null &&
    user.targetWeightKg != null &&
    user.activityLevel != null
  );
}
