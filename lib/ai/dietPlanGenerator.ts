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
6. PRIORITIZE THE USER'S OWN RECIPES ("availableRecipes"). This is a hard requirement, not a
   suggestion: these came from the user's own uploaded diet-plan PDF/DOCX and pasted Instagram/
   YouTube recipes — the plan must be built primarily FROM THEM, not invented from scratch.
   - If availableRecipes is non-empty, use as many of them as possible across the 7 days —
     rotate through the full list so each recipe appears at least once before any repeat, and
     reference them by their recipeId in the corresponding meal slot.
   - Only invent a new (AI-generated) dish for a meal slot when no available recipe fits that
     slot's macros/dietType/allergy constraints, or when there aren't enough available recipes to
     fill all 35 slots (7 days x 5 meals) — invented dishes should fill the gaps, not dominate the
     plan when the user has already provided their own recipes.
   - If availableRecipes is empty, generate original Indian dishes as usual.
7. If isGlp1 is true: make meals SMALLER and more frequent-feeling, favor easy-to-digest,
   low-fat, low-fiber-spike foods that reduce nausea (e.g. khichdi, moong dal, soft idli, curd rice,
   soups, boiled eggs/paneer), prioritize protein at every meal, and avoid very heavy/fried/spicy
   dishes that commonly trigger GLP-1 nausea.
8. Take medicalConditions into account (e.g. diabetes -> low glycemic index, avoid high-sugar fruit
   at night; hypertension -> low sodium; PCOS -> low refined carb).
9. Vary dishes across the 7 days (rotate, do not repeat the same dinner twice in the week) —
   except where rule 6 requires reusing a limited set of available recipes.

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
  )}\n\navailableRecipes (${availableRecipes.length} recipes uploaded/added by the user — see rule 6, prioritize these):\n${JSON.stringify(availableRecipes, null, 2)}`;

  const plan = await askClaudeForJSON<WeekPlan>({
    system: DIET_PLAN_SYSTEM_PROMPT,
    prompt,
    maxTokens: 16000,
  });
  return plan;
}
