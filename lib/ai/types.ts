export interface StructuredIngredient {
  name: string;
  quantity: number;
  unit: string; // g, ml, tbsp, cup, piece, etc.
}

export type RecipeMealType = "BREAKFAST" | "SNACK" | "LUNCH" | "DINNER" | null;

export interface StructuredRecipe {
  name: string;
  mealType: RecipeMealType;
  ingredients: StructuredIngredient[];
  instructions: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ironMg: number;
  calciumMg: number;
  micros?: Record<string, number>;
  aiEstimated: boolean;
}

export type MealSourceLabel = "PDF" | "DOCX" | "INSTAGRAM" | "YOUTUBE" | "MANUAL_TEXT" | "AI_GENERATED";

export interface MealEntry {
  name: string;
  recipeId?: string;
  ingredients: StructuredIngredient[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  source: MealSourceLabel;
  sourceUrl?: string | null;
}

export interface DayPlan {
  dayIndex: number; // 0..6
  dayLabel: string;
  meals: {
    breakfast: MealEntry;
    snack1: MealEntry;
    lunch: MealEntry;
    snack2: MealEntry;
    dinner: MealEntry;
  };
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

export interface WeekPlan {
  weekStartDate: string; // ISO date
  days: DayPlan[];
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string; // produce, dairy, grains, protein, spices, other
}
