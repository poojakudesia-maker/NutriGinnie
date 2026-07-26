import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validation/schemas";
import { computeCalorieProfile } from "@/lib/calculations";
import { SESSION_COOKIE } from "@/lib/session";
import { hashPassword } from "@/lib/auth/password";

/** POST /api/users — onboarding submission. Creates the user profile and calorie targets. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists. Try logging in instead." }, { status: 409 });
  }

  const passwordHash = await hashPassword(input.password);

  const profile = computeCalorieProfile({
    gender: input.gender,
    age: input.age,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    isGlp1: input.isGlp1,
  });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
      age: input.age,
      gender: input.gender,
      heightCm: input.heightCm,
      weightKg: input.weightKg,
      targetWeightKg: input.targetWeightKg,
      activityLevel: input.activityLevel,
      medicalConditions: input.medicalConditions,
      isGlp1: input.isGlp1,
      glp1Medication: input.glp1Medication ?? null,
      glp1DosageMg: input.glp1DosageMg ?? null,
      dietType: input.dietType,
      allergies: input.allergies,
      cuisinePreference: input.cuisinePreference,
      whatsappNumbers: input.whatsappNumbers,
      bmi: profile.bmi,
      bmr: profile.bmr,
      tdee: profile.tdee,
      calorieTarget: profile.calorieTarget,
      proteinTargetG: profile.proteinTargetG,
      deficitKcal: profile.deficitKcal,
    },
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  const res = NextResponse.json({ user: safeUser, calculations: profile }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
