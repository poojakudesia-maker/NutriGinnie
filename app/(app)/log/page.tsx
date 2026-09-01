import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate, dayIndexFromDate, localDateUTCMidnight } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { MealLogSlotCard } from "@/components/log/MealLogSlotCard";
import type { DayPlan } from "@/lib/ai/types";

const SLOTS: { key: keyof DayPlan["meals"]; slot: "BREAKFAST" | "SNACK1" | "LUNCH" | "SNACK2" | "DINNER"; label: string; icon: string }[] = [
  { key: "breakfast", slot: "BREAKFAST", label: "Breakfast", icon: "🥣" },
  { key: "snack1", slot: "SNACK1", label: "Mid-morning snack", icon: "🍎" },
  { key: "lunch", slot: "LUNCH", label: "Lunch", icon: "🍛" },
  { key: "snack2", slot: "SNACK2", label: "Evening snack", icon: "🥤" },
  { key: "dinner", slot: "DINNER", label: "Dinner", icon: "🍲" },
];

export default async function DailyLogPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = localDateUTCMidnight(new Date(), user.timezone, 0);
  const weekStart = weekStartDate(today);
  const dayIndex = dayIndexFromDate(today, weekStart);

  const [mealPlan, logs] = await Promise.all([
    prisma.mealPlan.findUnique({
      where: { userId_weekStartDate_dayIndex: { userId: user.id, weekStartDate: weekStart, dayIndex } },
    }),
    prisma.mealLog.findMany({ where: { userId: user.id, forDate: today } }),
  ]);

  const meals = mealPlan ? (mealPlan.meals as unknown as DayPlan["meals"]) : null;
  const logsBySlot = new Map(logs.map((l) => [l.slot, l]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-charcoal">Today&apos;s log</h1>
        <p className="text-xs text-charcoal-muted">
          {today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })}
        </p>
      </div>

      {!meals && (
        <Card className="bg-orange-light">
          <p className="text-sm text-orange-dark">No plan for today yet — you can still log a custom meal or photo below.</p>
        </Card>
      )}

      <div className="space-y-3">
        {SLOTS.map(({ key, slot, label, icon }) => (
          <MealLogSlotCard
            key={slot}
            userId={user.id}
            forDate={today.toISOString().slice(0, 10)}
            slot={slot}
            label={label}
            icon={icon}
            plannedMeal={meals?.[key] ?? null}
            existingLog={
              logsBySlot.has(slot)
                ? {
                    method: logsBySlot.get(slot)!.method,
                    description: logsBySlot.get(slot)!.description,
                    calories: logsBySlot.get(slot)!.calories,
                    proteinG: logsBySlot.get(slot)!.proteinG,
                  }
                : null
            }
          />
        ))}
      </div>
    </div>
  );
}
