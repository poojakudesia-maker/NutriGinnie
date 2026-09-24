import { Card } from "@/components/ui/Card";
import { SwapMealButton } from "./SwapMealButton";
import type { MealEntry, MealSourceLabel } from "@/lib/ai/types";

const SOURCE_BADGE: Record<MealSourceLabel, string> = {
  PDF: "From your diet plan PDF",
  DOCX: "From your diet plan doc",
  INSTAGRAM: "From Instagram",
  YOUTUBE: "From YouTube",
  MANUAL_TEXT: "From your saved recipe",
  AI_GENERATED: "AI generated",
};

export function MealCard({
  icon,
  label,
  meal,
  swap,
}: {
  icon: string;
  label: string;
  meal: MealEntry;
  swap?: { userId: string; weekStartDate: string; dayIndex: number; slot: "breakfast" | "snack1" | "lunch" | "snack2" | "dinner" };
}) {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-charcoal">
          <span className="mr-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-light align-middle">
            {icon}
          </span>
          {label}
        </p>
        <p className="text-xs font-medium text-orange-dark">{Math.round(meal.calories)} kcal</p>
      </div>
      <p className="mb-1 text-sm text-charcoal">{meal.name}</p>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-medium text-sage">
          {meal.sourceUrl ? (
            <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {SOURCE_BADGE[meal.source]}
            </a>
          ) : (
            SOURCE_BADGE[meal.source]
          )}
        </p>
        {swap && <SwapMealButton {...swap} />}
      </div>
      <div className="mb-2 flex gap-3 text-xs text-charcoal-muted">
        <span>P {Math.round(meal.proteinG)}g</span>
        <span>C {Math.round(meal.carbsG)}g</span>
        <span>F {Math.round(meal.fatG)}g</span>
        <span>Fiber {Math.round(meal.fiberG)}g</span>
      </div>
      {meal.ingredients?.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-charcoal-muted">
          {meal.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.name} — {ing.quantity}
              {ing.unit}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
