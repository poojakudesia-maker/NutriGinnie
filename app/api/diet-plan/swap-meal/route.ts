import { NextRequest, NextResponse } from "next/server";
import type { Prisma, RecipeMealType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { swapMealSchema } from "@/lib/validation/schemas";
import { toMealEntry } from "@/lib/plan/buildPlanFromRecipes";
import { generateSingleMealAlternative } from "@/lib/ai/dietPlanGenerator";
import { toErrorResponse } from "@/lib/api/errors";
import type { DayPlan, MealEntry } from "@/lib/ai/types";

const SLOT_MEAL_TYPE: Record<string, RecipeMealType> = {
  breakfast: "BREAKFAST",
  snack1: "SNACK",
  lunch: "LUNCH",
  snack2: "SNACK",
  dinner: "DINNER",
};

/** POST /api/diet-plan/swap-meal — replaces just one meal slot on one day, not the whole week. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = swapMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, dayIndex, slot } = parsed.data;
  const weekStartDate = new Date(parsed.data.weekStartDate);
  if (Number.isNaN(weekStartDate.getTime())) return NextResponse.json({ error: "Invalid weekStartDate" }, { status: 400 });

  const [user, mealPlan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.mealPlan.findUnique({ where: { userId_weekStartDate_dayIndex: { userId, weekStartDate, dayIndex } } }),
  ]);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!mealPlan) return NextResponse.json({ error: "No plan found for that day" }, { status: 404 });

  const meals = mealPlan.meals as unknown as DayPlan["meals"];
  const currentMeal = meals[slot];
  const usedRecipeIdsToday = new Set(Object.values(meals).map((m) => m.recipeId).filter(Boolean));

  try {
    const mealType = SLOT_MEAL_TYPE[slot];
    const pool = await prisma.recipe.findMany({ where: { userId, mealType } });
    const candidates = pool.filter((r) => r.id !== currentMeal.recipeId);
    const unusedToday = candidates.filter((r) => !usedRecipeIdsToday.has(r.id));
    const chosenRecipe = unusedToday[0] ?? candidates[0];

    let newMeal: MealEntry;
    if (chosenRecipe) {
      newMeal = toMealEntry(chosenRecipe);
    } else {
      if (!user.calorieTarget || !user.proteinTargetG || !user.gender || user.age == null || user.weightKg == null) {
        return NextResponse.json(
          { error: "No alternative recipe available, and your profile is missing details needed for an AI swap." },
          { status: 422 }
        );
      }
      newMeal = await generateSingleMealAlternative(
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
        mealType,
        currentMeal.calories || mealPlan.totalCalories / 5,
        Object.values(meals).map((m) => m.name)
      );
    }

    const updatedMeals = { ...meals, [slot]: newMeal };
    const totalCalories = Math.round(Object.values(updatedMeals).reduce((s, m) => s + m.calories, 0));
    const totalProteinG = Math.round(Object.values(updatedMeals).reduce((s, m) => s + m.proteinG, 0));
    const totalCarbsG = Math.round(Object.values(updatedMeals).reduce((s, m) => s + m.carbsG, 0));
    const totalFatG = Math.round(Object.values(updatedMeals).reduce((s, m) => s + m.fatG, 0));

    const updated = await prisma.mealPlan.update({
      where: { id: mealPlan.id },
      data: {
        meals: updatedMeals as unknown as Prisma.InputJsonValue,
        totalCalories,
        totalProteinG,
        totalCarbsG,
        totalFatG,
      },
    });

    return NextResponse.json({ mealPlan: updated });
  } catch (err) {
    return toErrorResponse(err, "Could not swap this meal.");
  }
}
