import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import { buildGroceryListForDay } from "@/lib/grocery/aggregator";
import { Card } from "@/components/ui/Card";
import RegenerateGroceryButton from "@/components/grocery/RegenerateGroceryButton";
import SendWhatsAppButton from "@/components/plan/SendWhatsAppButton";
import type { DayPlan, GroceryItem } from "@/lib/ai/types";

export default async function GroceryPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date: dateParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const targetDate = dateParam ? new Date(dateParam) : addDays(new Date(), 1);
  const iso = targetDate.toISOString().slice(0, 10);
  const weekStart = weekStartDate(targetDate);
  const dayIndex = dayIndexFromDate(targetDate, weekStart);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { userId_weekStartDate_dayIndex: { userId: user.id, weekStartDate: weekStart, dayIndex } },
  });

  let items: GroceryItem[] = [];
  if (mealPlan) {
    const existing = await prisma.grocery.findUnique({ where: { userId_forDate: { userId: user.id, forDate: targetDate } } });
    if (existing) {
      items = existing.items as unknown as GroceryItem[];
    } else {
      const dayPlan: DayPlan = {
        dayIndex: mealPlan.dayIndex,
        dayLabel: mealPlan.dayLabel,
        meals: mealPlan.meals as unknown as DayPlan["meals"],
        totalCalories: mealPlan.totalCalories,
        totalProteinG: mealPlan.totalProteinG,
        totalCarbsG: mealPlan.totalCarbsG,
        totalFatG: mealPlan.totalFatG,
      };
      items = buildGroceryListForDay(dayPlan);
      await prisma.grocery.upsert({
        where: { userId_forDate: { userId: user.id, forDate: targetDate } },
        update: { items: items as unknown as Prisma.InputJsonValue },
        create: { userId: user.id, forDate: targetDate, items: items as unknown as Prisma.InputJsonValue },
      });
    }
  }

  const byCategory = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const prevIso = addDays(targetDate, -1).toISOString().slice(0, 10);
  const nextIso = addDays(targetDate, 1).toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-charcoal">Grocery list</h1>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/grocery?date=${prevIso}`} className="font-semibold text-orange-dark">
            ‹
          </Link>
          <span className="font-medium text-charcoal">{mealPlan?.dayLabel ?? iso}</span>
          <Link href={`/grocery?date=${nextIso}`} className="font-semibold text-orange-dark">
            ›
          </Link>
        </div>
      </div>

      {!mealPlan ? (
        <Card>
          <p className="text-sm text-charcoal-muted">No meal plan for {iso} yet. Generate your weekly plan first.</p>
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between bg-cream-deep">
            <RegenerateGroceryButton userId={user.id} forDate={iso} />
            <SendWhatsAppButton userId={user.id} type="GROCERY" day={iso} hasNumbers={user.whatsappNumbers.length > 0} />
          </Card>

          {Array.from(byCategory.entries()).map(([category, categoryItems]) => (
            <Card key={category}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-charcoal">{category}</h2>
              <ul className="space-y-1 text-sm text-charcoal">
                {categoryItems.map((item, i) => (
                  <li key={i} className="flex justify-between border-b border-warm-border py-1 last:border-0">
                    <span>{item.name}</span>
                    <span className="text-charcoal-muted">
                      {item.quantity}
                      {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
