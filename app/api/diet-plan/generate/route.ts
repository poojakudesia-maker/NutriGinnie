import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generatePlanSchema } from "@/lib/validation/schemas";
import { generateWeekPlan } from "@/lib/ai/dietPlanGenerator";
import { weekStartDate } from "@/lib/utils";

/** POST /api/diet-plan/generate — { userId } -> generates and persists this week's 7-day plan. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = generatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.calorieTarget || !user.proteinTargetG) {
    return NextResponse.json({ error: "User is missing calorie/protein targets. Complete onboarding first." }, { status: 422 });
  }

  const recipes = await prisma.recipe.findMany({ where: { userId } });

  const plan = await generateWeekPlan(
    {
      name: user.name,
      gender: user.gender,
      age: user.age,
      weightKg: user.weightKg,
      dietType: user.dietType,
      allergies: user.allergies,
      cuisinePreference: user.cuisinePreference,
      medicalConditions: user.medicalConditions,
      isGlp1: user.isGlp1,
      calorieTarget: user.calorieTarget,
      proteinTargetG: user.proteinTargetG,
    },
    recipes.map((r) => ({ id: r.id, name: r.name, calories: r.calories, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG }))
  );

  const weekStart = weekStartDate();

  await prisma.mealPlan.deleteMany({ where: { userId, weekStartDate: weekStart } });

  const created = await prisma.$transaction(
    plan.days.map((day) =>
      prisma.mealPlan.create({
        data: {
          userId,
          weekStartDate: weekStart,
          dayIndex: day.dayIndex,
          dayLabel: day.dayLabel,
          meals: day.meals as unknown as Prisma.InputJsonValue,
          totalCalories: day.totalCalories,
          totalProteinG: day.totalProteinG,
          totalCarbsG: day.totalCarbsG,
          totalFatG: day.totalFatG,
        },
      })
    )
  );

  return NextResponse.json({ weekStartDate: weekStart, days: created }, { status: 201 });
}
