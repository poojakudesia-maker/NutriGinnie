import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCalorieProfile } from "@/lib/calculations";
import { settingsSchema } from "@/lib/validation/schemas";

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

  if (body.whatsappNumbers !== undefined && Object.keys(body).length === 1) {
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }
    const user = await prisma.user.update({ where: { id }, data: { whatsappNumbers: parsed.data.whatsappNumbers } });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  }

  const merged = {
    gender: body.gender ?? existing.gender,
    age: body.age ?? existing.age,
    heightCm: body.heightCm ?? existing.heightCm,
    weightKg: body.weightKg ?? existing.weightKg,
    activityLevel: body.activityLevel ?? existing.activityLevel,
    isGlp1: body.isGlp1 ?? existing.isGlp1,
  };

  const profile = computeCalorieProfile(merged);

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...("name" in body ? { name: body.name } : {}),
      ...("targetWeightKg" in body ? { targetWeightKg: body.targetWeightKg } : {}),
      ...("medicalConditions" in body ? { medicalConditions: body.medicalConditions } : {}),
      ...("glp1Medication" in body ? { glp1Medication: body.glp1Medication } : {}),
      ...("glp1DosageMg" in body ? { glp1DosageMg: body.glp1DosageMg } : {}),
      ...("dietType" in body ? { dietType: body.dietType } : {}),
      ...("allergies" in body ? { allergies: body.allergies } : {}),
      ...("cuisinePreference" in body ? { cuisinePreference: body.cuisinePreference } : {}),
      gender: merged.gender,
      age: merged.age,
      heightCm: merged.heightCm,
      weightKg: merged.weightKg,
      activityLevel: merged.activityLevel,
      isGlp1: merged.isGlp1,
      bmi: profile.bmi,
      bmr: profile.bmr,
      tdee: profile.tdee,
      calorieTarget: profile.calorieTarget,
      proteinTargetG: profile.proteinTargetG,
      deficitKcal: profile.deficitKcal,
    },
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return NextResponse.json({ user: safeUser, calculations: profile });
}
