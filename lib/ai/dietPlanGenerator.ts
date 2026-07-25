import { askClaudeForJSON } from "./client";
import type { WeekPlan } from "./types";

export interface DietPlanUserContext {
  name: string;
  gender: "MALE" | "FEMALE";
  age: number;
  weightKg: number;
  dietType: "VEG" | "EGGETARIAN" | "NON_VEG";
  allergies: string[];
  cuisinePreference: string[];
  medicalConditions: string[];
  isGlp1: boolean;
  calorieTarget: number;
  proteinTargetG: number;
}

export interface AvailableRecipe {
  id: string;
  name: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

const DIET_PLAN_SYSTEM_PROMPT = `You are a registered-dietitian-grade meal planning engine specializing in Indian cuisine.
You generate 7-day rotating diet plans (breakfast, morning snack, lunch, afternoon snack, dinner).

Hard rules:
1. Each day's total calories must be within 5% of the user's calorieTarget.
2. Each day's total protein must meet or exceed proteinTargetG (spread across meals).
3. Respect dietType strictly: VEG = no meat/fish/egg, EGGETARIAN = veg + eggs allowed, NON_VEG = anything.
4. NEVER include any ingredient listed in the user's allergies.
5. Favor the user's cuisinePreference (Indian home-style cooking by default): dal, sabzi, roti, rice,
   idli/dosa, poha, paneer, curd, sprouts, etc. Use recognizable Indian dish names.
6. Reuse the user's own uploaded/pasted recipes ("availableRecipes") wherever they fit the day's
   macros — reference them by recipeId when used, and prefer them over inventing new dishes.
7. If isGlp1 is true: make meals SMALLER and more frequent-feeling, favor easy-to-digest,
   low-fat, low-fiber-spike foods that reduce nausea (e.g. khichdi, moong dal, soft idli, curd rice,
   soups, boiled eggs/paneer), prioritize protein at every meal, and avoid very heavy/fried/spicy
   dishes that commonly trigger GLP-1 nausea.
8. Take medicalConditions into account (e.g. diabetes -> low glycemic index, avoid high-sugar fruit
   at night; hypertension -> low sodium; PCOS -> low refined carb).
9. Vary dishes across the 7 days (rotate, do not repeat the same dinner twice in the week).

Return JSON matching this TypeScript type exactly:
{
  weekStartDate: string; // ISO date, use the placeholder "PLACEHOLDER" — caller will overwrite it
  days: {
    dayIndex: number; // 0-6
    dayLabel: string; // "Monday".."Sunday"
    meals: {
      breakfast: MealEntry; snack1: MealEntry; lunch: MealEntry; snack2: MealEntry; dinner: MealEntry;
    };
    totalCalories: number; totalProteinG: number; totalCarbsG: number; totalFatG: number;
  }[];
}
where MealEntry = { name: string; recipeId?: string; ingredients: {name:string; quantity:number; unit:string}[];
  calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number }`;

export async function generateWeekPlan(
  user: DietPlanUserContext,
  availableRecipes: AvailableRecipe[]
): Promise<WeekPlan> {
  const prompt = `Generate a 7-day rotating Indian diet plan for this user:\n${JSON.stringify(
    user,
    null,
    2
  )}\n\navailableRecipes (reuse via recipeId when they fit):\n${JSON.stringify(availableRecipes, null, 2)}`;

  const plan = await askClaudeForJSON<WeekPlan>({
    system: DIET_PLAN_SYSTEM_PROMPT,
    prompt,
    maxTokens: 8192,
  });
  return plan;
}
