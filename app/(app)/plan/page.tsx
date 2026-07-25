import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
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
        <h1 className="text-xl font-bold text-slate-900">Weekly plan</h1>
        <GeneratePlanButton userId={user.id} label={days.length ? "Regenerate" : "Generate"} />
      </div>

      {days.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">
            No plan yet for the week of {weekStart.toDateString()}. Generate one to get 7 days of Indian meals matched
            to your calorie and protein targets.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const date = new Date(weekStart);
            date.setUTCDate(date.getUTCDate() + day.dayIndex);
            const iso = date.toISOString().slice(0, 10);
            return (
              <Link key={day.id} href={`/plan/${iso}`}>
                <Card className="flex items-center justify-between hover:border-emerald-300">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{day.dayLabel}</p>
                    <p className="text-xs text-slate-500">
                      {Math.round(day.totalCalories)} kcal · {Math.round(day.totalProteinG)}g protein
                    </p>
                  </div>
                  <span className="text-slate-400">›</span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
