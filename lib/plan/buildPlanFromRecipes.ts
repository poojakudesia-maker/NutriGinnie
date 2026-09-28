import type { Recipe, RecipeMealType } from "@prisma/client";
import { DAY_LABELS } from "@/lib/utils";
import type { DayPlan, MealEntry, StructuredIngredient, WeekPlan } from "@/lib/ai/types";

/**
 * Builds a 7-day plan entirely from the user's own saved recipes (uploaded
 * PDF/DOCX, pasted Instagram/YouTube) — no AI call. Recipes are grouped by
 * mealType and rotated through each slot so every recipe gets used before
 * any repeats; a recipe with no mealType (or an empty category) falls back
 * to the closest available pool so every slot always gets filled as long as
 * the user has at least one recipe.
 *
 * Because nothing is invented, day totals reflect whatever the user's own
 * recipes actually add up to — they won't be precision-tuned to
 * calorieTarget/proteinTargetG the way the AI-generated path is.
 */
export interface BuildPlanResult {
  plan: WeekPlan;
  warnings: string[];
}

const SLOT_LABELS: Record<RecipeMealType, string> = {
  BREAKFAST: "breakfast",
  SNACK: "snack",
  LUNCH: "lunch",
  DINNER: "dinner",
};

// Each week needs this many meals per type (snack covers both snack1 + snack2).
const SLOTS_NEEDED_PER_WEEK: Record<RecipeMealType, number> = { BREAKFAST: 7, SNACK: 14, LUNCH: 7, DINNER: 7 };

export function buildPlanFromRecipes(recipes: Recipe[]): BuildPlanResult {
  const byType = groupByMealType(recipes);
  const cursors: Record<RecipeMealType, number> = { BREAKFAST: 0, SNACK: 0, LUNCH: 0, DINNER: 0 };
  const warnings = buildShortageWarnings(byType);

  const pick = (type: RecipeMealType): Recipe => {
    const pool = byType[type].length > 0 ? byType[type] : recipes;
    const idx = cursors[type] % pool.length;
    cursors[type]++;
    return pool[idx];
  };

  const days: DayPlan[] = Array.from({ length: 7 }, (_, dayIndex) => {
    const breakfast = toMealEntry(pick("BREAKFAST"));
    const snack1 = toMealEntry(pick("SNACK"));
    const lunch = toMealEntry(pick("LUNCH"));
    const snack2 = toMealEntry(pick("SNACK"));
    const dinner = toMealEntry(pick("DINNER"));

    const meals = { breakfast, snack1, lunch, snack2, dinner };
    const totalCalories = sumField(meals, "calories");
    const totalProteinG = sumField(meals, "proteinG");
    const totalCarbsG = sumField(meals, "carbsG");
    const totalFatG = sumField(meals, "fatG");

    return {
      dayIndex,
      dayLabel: DAY_LABELS[dayIndex],
      meals,
      totalCalories,
      totalProteinG,
      totalCarbsG,
      totalFatG,
    };
  });

  return { plan: { weekStartDate: "PLACEHOLDER", days }, warnings };
}

/**
 * Flags meal-type pools that are empty (slot gets filled from other
 * categories) or too small to cover the week without heavy repetition, so
 * the UI can tell the user why their plan looks repetitive instead of
 * silently rotating the same 1-2 recipes all week.
 */
function buildShortageWarnings(byType: Record<RecipeMealType, Recipe[]>): string[] {
  const warnings: string[] = [];
  for (const type of Object.keys(SLOT_LABELS) as RecipeMealType[]) {
    const count = byType[type].length;
    const label = SLOT_LABELS[type];
    if (count === 0) {
      warnings.push(`You have no recipes tagged as ${label} — those slots are being filled from your other recipes instead.`);
    } else if (count < SLOTS_NEEDED_PER_WEEK[type]) {
      warnings.push(
        `You only have ${count} ${label} recipe${count === 1 ? "" : "s"}, so it'll repeat across the week. Add more ${label} recipes for more variety.`
      );
    }
  }
  return warnings;
}

function groupByMealType(recipes: Recipe[]): Record<RecipeMealType, Recipe[]> {
  const groups: Record<RecipeMealType, Recipe[]> = { BREAKFAST: [], SNACK: [], LUNCH: [], DINNER: [] };
  for (const recipe of recipes) {
    if (recipe.mealType) groups[recipe.mealType].push(recipe);
  }
  return groups;
}

export function toMealEntry(recipe: Recipe): MealEntry {
  return {
    name: recipe.name,
    recipeId: recipe.id,
    ingredients: (recipe.ingredients as unknown as StructuredIngredient[]) ?? [],
    calories: recipe.calories ?? 0,
    proteinG: recipe.proteinG ?? 0,
    carbsG: recipe.carbsG ?? 0,
    fatG: recipe.fatG ?? 0,
    fiberG: recipe.fiberG ?? 0,
    source: recipe.source,
    sourceUrl: recipe.sourceUrl,
  };
}

function sumField(meals: DayPlan["meals"], field: "calories" | "proteinG" | "carbsG" | "fatG"): number {
  return Math.round(
    meals.breakfast[field] + meals.snack1[field] + meals.lunch[field] + meals.snack2[field] + meals.dinner[field]
  );
}
