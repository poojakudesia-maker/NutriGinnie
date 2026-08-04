import { askClaudeForJSON } from "./client";
import type { StructuredRecipe } from "./types";

const RECIPE_SYSTEM_PROMPT = `You are a clinical nutrition data extraction engine for an Indian diet-planning app.
Given raw text (a pasted recipe, an Instagram caption, or extracted text from a diet-plan PDF),
extract every distinct dish into a structured recipe object.

For each dish produce:
- name: the dish name
- mealType: your best classification of "BREAKFAST", "SNACK", "LUNCH", or "DINNER" — use explicit
  headings/labels in the source if present (e.g. a PDF section titled "Breakfast"); otherwise infer
  from the dish itself (e.g. poha/idli/upma -> BREAKFAST, roasted chana/fruit -> SNACK, dal-rice/
  roti-sabzi -> LUNCH or DINNER). Use null only if genuinely ambiguous.
- ingredients: array of { name, quantity (number), unit (g, ml, tbsp, tsp, cup, piece, katori, etc.) }
- instructions: short cooking steps (1-4 sentences), empty string if not present in source
- calories, proteinG, carbsG, fatG, fiberG, ironMg, calciumMg: numeric nutrition PER SERVING

If the source text does not state nutrition values explicitly, ESTIMATE them yourself using
standard Indian nutrition references (IFCT / USDA) based on the ingredients and quantities, and
set "aiEstimated": true for that recipe. If values are explicitly stated in the source, use them
and set "aiEstimated": false.

Return a JSON array of recipe objects matching this TypeScript type:
{ name: string; mealType: "BREAKFAST" | "SNACK" | "LUNCH" | "DINNER" | null;
  ingredients: {name: string; quantity: number; unit: string}[]; instructions: string;
  calories: number; proteinG: number; carbsG: number; fatG: number; fiberG: number; ironMg: number;
  calciumMg: number; micros?: Record<string, number>; aiEstimated: boolean }[]`;

export async function parseRecipesFromText(rawText: string): Promise<StructuredRecipe[]> {
  return askClaudeForJSON<StructuredRecipe[]>({
    system: RECIPE_SYSTEM_PROMPT,
    prompt: `Extract structured recipes from the following text:\n\n"""\n${rawText.slice(0, 15000)}\n"""`,
    maxTokens: 8192,
  });
}

/**
 * Neither Instagram nor YouTube expose a public unauthenticated API for
 * scraping post captions or video content server-side without violating ToS
 * or needing a login. We ask the user to paste the caption/description/
 * transcript text instead (handled by the UI), and this helper just
 * documents the contract for a future scraper/transcript-API integration.
 */
export async function parseRecipeFromVideoCaption(caption: string, sourceUrl: string): Promise<StructuredRecipe[]> {
  return askClaudeForJSON<StructuredRecipe[]>({
    system: RECIPE_SYSTEM_PROMPT,
    prompt: `The following caption/description was copied from a recipe video post (${sourceUrl}). Extract structured recipe(s):\n\n"""\n${caption.slice(0, 8000)}\n"""`,
    maxTokens: 8192,
  });
}
