import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validation/schemas";
import { computeCalorieProfile } from "@/lib/calculations";
import { SESSION_COOKIE } from "@/lib/session";

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

  const res = NextResponse.json({ user, calculations: profile }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
