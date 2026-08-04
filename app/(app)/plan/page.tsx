import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import GeneratePlanButton from "@/components/plan/GeneratePlanButton";

export default async function WeeklyPlanPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const weekStart = weekStartDate();
  const days = await prisma.mealPlan.findMany({
    where: { userId: user.id, weekStartDate: weekStart },
    orderBy: { dayIndex: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-charcoal">Weekly plan</h1>
        <GeneratePlanButton userId={user.id} label={days.length ? "Regenerate" : "Generate"} />
      </div>

      {days.length === 0 ? (
        <Card>
          <p className="text-sm text-charcoal-muted">
            No plan yet for the week of {weekStart.toDateString()}. Generate one to get 7 days of Indian meals matched
            to your calorie and protein targets.
          </p>
        </Card>
      ) : (
        <>
          <Card className="!p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((day) => {
                const date = new Date(weekStart);
                date.setUTCDate(date.getUTCDate() + day.dayIndex);
                const iso = date.toISOString().slice(0, 10);
                const dayNum = date.getUTCDate();
                const monthShort = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
                const isFirst = day.dayIndex === 0;
                return (
                  <Link key={day.id} href={`/plan/${iso}`} className="shrink-0">
                    <div
                      className={cn(
                        "flex w-16 flex-col items-center rounded-2xl py-2.5 text-sm font-semibold",
                        isFirst
                          ? "bg-gradient-to-br from-orange to-orange-dark text-white"
                          : "bg-cream-deep text-charcoal hover:bg-warm-border"
                      )}
                    >
                      <span>{String(dayNum).padStart(2, "0")}</span>
                      <span className="text-xs font-normal">{monthShort}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <div className="space-y-2">
            {days.map((day) => {
              const date = new Date(weekStart);
              date.setUTCDate(date.getUTCDate() + day.dayIndex);
              const iso = date.toISOString().slice(0, 10);
              return (
                <Link key={day.id} href={`/plan/${iso}`}>
                  <Card className="flex items-center justify-between hover:border-orange">
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{day.dayLabel}</p>
                      <p className="text-xs text-charcoal-muted">
                        {Math.round(day.totalCalories)} kcal · {Math.round(day.totalProteinG)}g protein
                      </p>
                    </div>
                    <span className="text-orange">›</span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
