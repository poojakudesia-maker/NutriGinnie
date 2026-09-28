import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { weekStartDate, dayIndexFromDate, localDateUTCMidnight } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { WeightChart } from "@/components/progress/WeightChart";
import { LogWeightForm } from "@/components/progress/LogWeightForm";
import { RingStat } from "@/components/progress/RingStat";
import { Glp1LogForm } from "@/components/progress/Glp1LogForm";

const ADHERENCE_WINDOW_DAYS = 7;

export default async function ProgressPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = localDateUTCMidnight(new Date(), user.timezone, 0);
  const windowStart = new Date(today);
  windowStart.setUTCDate(windowStart.getUTCDate() - (ADHERENCE_WINDOW_DAYS - 1));

  const [weightLogs, mealLogsInWindow, glp1Logs] = await Promise.all([
    prisma.weightLog.findMany({ where: { userId: user.id }, orderBy: { loggedAt: "asc" }, take: 90 }),
    prisma.mealLog.findMany({ where: { userId: user.id, forDate: { gte: windowStart, lte: today } } }),
    user.isGlp1 ? prisma.glp1Log.findMany({ where: { userId: user.id }, orderBy: { loggedAt: "desc" }, take: 20 }) : Promise.resolve([]),
  ]);

  // Adherence: across the last 7 days that actually had a generated plan, what fraction of the
  // 5 daily slots got logged (any method) vs. left blank.
  let plannedSlotDays = 0;
  for (let i = 0; i < ADHERENCE_WINDOW_DAYS; i++) {
    const day = new Date(windowStart);
    day.setUTCDate(day.getUTCDate() + i);
    const weekStart = weekStartDate(day);
    const dayIndex = dayIndexFromDate(day, weekStart);
    const hasPlan = await prisma.mealPlan.findUnique({
      where: { userId_weekStartDate_dayIndex: { userId: user.id, weekStartDate: weekStart, dayIndex } },
      select: { id: true },
    });
    if (hasPlan) plannedSlotDays += 5;
  }
  const adherencePct = plannedSlotDays > 0 ? (mealLogsInWindow.length / plannedSlotDays) * 100 : null;

  const todayLogs = mealLogsInWindow.filter((l) => l.forDate.getTime() === today.getTime());
  const todayCalories = todayLogs.reduce((sum, l) => sum + l.calories, 0);
  const calorieRingPct = user.calorieTarget ? (todayCalories / user.calorieTarget) * 100 : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-charcoal">Progress</h1>

      <Card>
        <div className="flex items-center justify-around">
          <RingStat
            pct={adherencePct ?? 0}
            label="Adherence"
            sublabel={plannedSlotDays > 0 ? `last ${ADHERENCE_WINDOW_DAYS} days` : "no plan yet"}
            color="var(--color-sage)"
          />
          <RingStat
            pct={calorieRingPct ?? 0}
            label="Today's calories"
            sublabel={user.calorieTarget ? `${Math.round(todayCalories)} / ${Math.round(user.calorieTarget)} kcal` : "no target set"}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-charcoal">Weight trend</h2>
        <WeightChart logs={weightLogs} />
        <div className="mt-3">
          <LogWeightForm userId={user.id} currentWeightKg={user.weightKg} />
        </div>
      </Card>

      {user.isGlp1 && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-charcoal">GLP-1 check-in</h2>
          <Glp1LogForm userId={user.id} recentLogs={glp1Logs} />
        </Card>
      )}
    </div>
  );
}
