"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StructuredIngredient } from "@/lib/ai/types";

const MEAL_TYPE_LABEL: Record<string, string> = {
  BREAKFAST: "🥣 Breakfast",
  SNACK: "🍎 Snack",
  LUNCH: "🍛 Lunch",
  DINNER: "🍲 Dinner",
};

const SOURCE_LABEL: Record<string, string> = {
  PDF: "PDF upload",
  DOCX: "DOCX upload",
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  MANUAL_TEXT: "Pasted text",
  AI_GENERATED: "AI-generated",
};

export interface RecipeCardData {
  id: string;
  userId: string;
  name: string;
  mealType: string | null;
  source: string;
  sourceUrl: string | null;
  instructions: string | null;
  ingredients: unknown;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  aiEstimated: boolean;
}

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ingredients = (recipe.ingredients as StructuredIngredient[] | null) ?? [];

  const deleteRecipe = async () => {
    if (!confirm(`Remove "${recipe.name}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}?userId=${recipe.userId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setDeleting(false);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="border-b border-warm-border py-2 last:border-0">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center justify-between text-left">
          <div>
            <p className="text-sm font-medium text-charcoal">{recipe.name}</p>
            <p className="text-xs text-charcoal-muted">
              {recipe.mealType ? MEAL_TYPE_LABEL[recipe.mealType] : "Unclassified"} · {SOURCE_LABEL[recipe.source] ?? recipe.source}
              {recipe.aiEstimated ? " · AI-estimated nutrition" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-charcoal-muted">{recipe.calories ? `${Math.round(recipe.calories)} kcal` : "—"}</span>
            <span className="text-orange">{open ? "▲" : "▼"}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={deleteRecipe}
          disabled={deleting}
          aria-label={`Delete ${recipe.name}`}
          className="ml-2 shrink-0 rounded-lg px-1.5 py-1 text-charcoal-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          🗑️
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-xl bg-cream p-3 text-xs text-charcoal-muted">
          <div className="mb-2 flex flex-wrap gap-3">
            <span>P {Math.round(recipe.proteinG ?? 0)}g</span>
            <span>C {Math.round(recipe.carbsG ?? 0)}g</span>
            <span>F {Math.round(recipe.fatG ?? 0)}g</span>
            <span>Fiber {Math.round(recipe.fiberG ?? 0)}g</span>
          </div>
          {ingredients.length > 0 && (
            <>
              <p className="mb-1 font-medium text-charcoal">Ingredients</p>
              <ul className="mb-2 list-disc space-y-0.5 pl-4">
                {ingredients.map((ing, i) => (
                  <li key={i}>
                    {ing.name} — {ing.quantity}
                    {ing.unit}
                  </li>
                ))}
              </ul>
            </>
          )}
          {recipe.instructions && (
            <>
              <p className="mb-1 font-medium text-charcoal">Instructions</p>
              <p>{recipe.instructions}</p>
            </>
          )}
          {recipe.sourceUrl && (
            <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-orange-dark underline">
              View original link
            </a>
          )}
        </div>
      )}
    </div>
  );
}
