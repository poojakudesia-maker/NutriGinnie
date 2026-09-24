import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCalorieProfile, applyCalorieBudget } from "@/lib/calculations";
import { settingsSchema, completeProfileSchema } from "@/lib/validation/schemas";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser });
}

/**
 * PATCH /api/users/[id] — partial update. Used by:
 *  - Settings screen (whatsappNumbers only, validated separately)
 *  - Profile edits that should trigger recalculation (weightKg, activityLevel, etc.)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const LIGHT_SETTINGS_KEYS = new Set(["whatsappNumbers", "timezone", "dispatchHour", "whatsappRemindersEnabled"]);
  if (Object.keys(body).length > 0 && Object.keys(body).every((k) => LIGHT_SETTINGS_KEYS.has(k))) {
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }
    const user = await prisma.user.update({ where: { id }, data: parsed.data });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  }

  const parsed = completeProfileSchema.safeParse({
    age: body.age ?? existing.age,
    gender: body.gender ?? existing.gender,
    heightCm: body.heightCm ?? existing.heightCm,
    weightKg: body.weightKg ?? existing.weightKg,
    targetWeightKg: body.targetWeightKg ?? existing.targetWeightKg,
    activityLevel: body.activityLevel ?? existing.activityLevel,
    medicalConditions: body.medicalConditions ?? existing.medicalConditions,
    isGlp1: body.isGlp1 ?? existing.isGlp1,
    glp1Medication: "glp1Medication" in body ? body.glp1Medication : existing.glp1Medication,
    glp1DosageMg: "glp1DosageMg" in body ? body.glp1DosageMg : existing.glp1DosageMg,
    dietType: body.dietType ?? existing.dietType,
    allergies: body.allergies ?? existing.allergies,
    cuisinePreference: body.cuisinePreference ?? existing.cuisinePreference,
    whatsappNumbers: body.whatsappNumbers ?? existing.whatsappNumbers,
    timezone: body.timezone ?? existing.timezone,
    dispatchHour: body.dispatchHour ?? existing.dispatchHour,
    calorieSource: body.calorieSource ?? existing.calorieSource,
    manualCalorieTarget: "manualCalorieTarget" in body ? body.manualCalorieTarget : existing.calorieTarget ?? undefined,
    manualProteinTargetG: "manualProteinTargetG" in body ? body.manualProteinTargetG : existing.proteinTargetG ?? undefined,
    manualCarbTargetG: "manualCarbTargetG" in body ? body.manualCarbTargetG : existing.carbTargetG ?? undefined,
    manualFatTargetG: "manualFatTargetG" in body ? body.manualFatTargetG : existing.fatTargetG ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const {
    gender, age, heightCm, weightKg, targetWeightKg, activityLevel, isGlp1,
    medicalConditions, glp1Medication, glp1DosageMg, dietType, allergies, cuisinePreference, whatsappNumbers,
    timezone, dispatchHour,
  } = parsed.data;

  const profile = computeCalorieProfile({ gender, age, heightCm, weightKg, activityLevel, isGlp1 });
  const budget = applyCalorieBudget(profile, parsed.data, profile.tdee);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...("name" in body ? { name: body.name } : {}),
      medicalConditions,
      glp1Medication,
      glp1DosageMg,
      dietType,
      allergies,
      cuisinePreference,
      whatsappNumbers,
      timezone,
      dispatchHour,
      calorieSource: parsed.data.calorieSource,
      gender,
      age,
      heightCm,
      weightKg,
      targetWeightKg,
      activityLevel,
      isGlp1,
      bmi: profile.bmi,
      bmr: profile.bmr,
      tdee: profile.tdee,
      calorieTarget: budget.calorieTarget,
      proteinTargetG: budget.proteinTargetG,
      carbTargetG: budget.carbTargetG,
      fatTargetG: budget.fatTargetG,
      deficitKcal: budget.deficitKcal,
    },
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser, calculations: profile });
}
