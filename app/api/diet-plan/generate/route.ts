import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generatePlanSchema } from "@/lib/validation/schemas";
import { generateWeekPlan } from "@/lib/ai/dietPlanGenerator";
import { buildPlanFromRecipes } from "@/lib/plan/buildPlanFromRecipes";
import { weekStartDate } from "@/lib/utils";
import { toErrorResponse } from "@/lib/api/errors";
import type { WeekPlan } from "@/lib/ai/types";

/** POST /api/diet-plan/generate — { userId } -> generates and persists this week's 7-day plan. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = generatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, mode } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.calorieTarget || !user.proteinTargetG || !user.gender || user.age == null || user.weightKg == null) {
    return NextResponse.json({ error: "Complete your profile first — some health details are missing." }, { status: 422 });
  }
  const { gender, age, weightKg } = user;

  const recipes = await prisma.recipe.findMany({ where: { userId } });
  const useOwnRecipes = mode === "AUTO" && recipes.length > 0;

  try {
    const plan: WeekPlan = useOwnRecipes
      ? buildPlanFromRecipes(recipes)
      : await generateWeekPlan(
          {
            name: user.name,
            gender,
            age,
            weightKg,
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

    return NextResponse.json({ weekStartDate: weekStart, days: created, usedOwnRecipes: useOwnRecipes }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "Diet plan generation failed.");
  }
}
