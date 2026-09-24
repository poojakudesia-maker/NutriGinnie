import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { MealCard } from "@/components/plan/MealCard";
import SendWhatsAppButton from "@/components/plan/SendWhatsAppButton";
import type { DayPlan } from "@/lib/ai/types";

export default async function DailyPlanPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const date = new Date(day);
  if (Number.isNaN(date.getTime())) notFound();

  const weekStart = weekStartDate(date);
  const dayIndex = dayIndexFromDate(date, weekStart);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { userId_weekStartDate_dayIndex: { userId: user.id, weekStartDate: weekStart, dayIndex } },
  });
  if (!mealPlan) notFound();

  const meals = mealPlan.meals as unknown as DayPlan["meals"];

  return (
    <div className="space-y-4">
      <Link href="/plan" className="text-sm font-medium text-orange-dark">
        ‹ Back to week
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-charcoal">{mealPlan.dayLabel}</h1>
        <p className="text-sm text-charcoal-muted">
          {Math.round(mealPlan.totalCalories)} kcal · {Math.round(mealPlan.totalProteinG)}g protein
        </p>
      </div>

      <Card className="bg-cream-deep">
        <SendWhatsAppButton userId={user.id} type="DIET" day={day} hasNumbers={user.whatsappNumbers.length > 0} />
      </Card>

      <div className="space-y-3">
        {(
          [
            ["breakfast", "🥣", "Breakfast"],
            ["snack1", "🍎", "Mid-morning snack"],
            ["lunch", "🍛", "Lunch"],
            ["snack2", "🥤", "Evening snack"],
            ["dinner", "🍲", "Dinner"],
          ] as const
        ).map(([slot, icon, label]) => (
          <MealCard
            key={slot}
            icon={icon}
            label={label}
            meal={meals[slot]}
            swap={{ userId: user.id, weekStartDate: weekStart.toISOString().slice(0, 10), dayIndex, slot }}
          />
        ))}
      </div>
    </div>
  );
}
