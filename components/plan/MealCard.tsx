import { Card } from "@/components/ui/Card";
import type { MealEntry } from "@/lib/ai/types";

export function MealCard({ icon, label, meal }: { icon: string; label: string; meal: MealEntry }) {
  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {icon} {label}
        </p>
        <p className="text-xs text-slate-500">{Math.round(meal.calories)} kcal</p>
      </div>
      <p className="mb-2 text-sm text-slate-700">{meal.name}</p>
      <div className="mb-2 flex gap-3 text-xs text-slate-500">
        <span>P {Math.round(meal.proteinG)}g</span>
        <span>C {Math.round(meal.carbsG)}g</span>
        <span>F {Math.round(meal.fatG)}g</span>
        <span>Fiber {Math.round(meal.fiberG)}g</span>
      </div>
      {meal.ingredients?.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-500">
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
