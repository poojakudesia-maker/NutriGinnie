import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { bmiCategory } from "@/lib/calculations";
import { weekStartDate } from "@/lib/utils";
import { StatTile } from "@/components/dashboard/StatTile";
import WeightTracker from "@/components/dashboard/WeightTracker";
import WaterTracker from "@/components/dashboard/WaterTracker";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // (app) layout already redirects when there's no session

  const weekStart = weekStartDate();
  const [weightLogs, waterLogs, mealPlanCount] = await Promise.all([
    prisma.weightLog.findMany({ where: { userId: user.id }, orderBy: { loggedAt: "asc" } }),
    prisma.waterLog.findMany({
      where: { userId: user.id, loggedAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } },
    }),
    prisma.mealPlan.count({ where: { userId: user.id, weekStartDate: weekStart } }),
  ]);

  const totalWaterMl = waterLogs.reduce((sum, l) => sum + l.amountMl, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hi {user.name} 👋</h1>
        <p className="text-sm text-slate-500">Here&apos;s where your plan stands today.</p>
      </div>

      {user.isGlp1 && (
        <div className="rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">
          GLP-1 protocol active{user.glp1Medication ? ` (${user.glp1Medication})` : ""}: smaller deficit, higher
          protein target, easy-to-digest meals.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="BMI" value={user.bmi?.toFixed(1) ?? "—"} sub={user.bmi ? bmiCategory(user.bmi) : undefined} />
        <StatTile label="BMR" value={user.bmr ? `${Math.round(user.bmr)} kcal` : "—"} />
        <StatTile label="TDEE" value={user.tdee ? `${Math.round(user.tdee)} kcal` : "—"} />
        <StatTile
          label="Calorie target"
          value={user.calorieTarget ? `${Math.round(user.calorieTarget)} kcal` : "—"}
          sub={user.deficitKcal ? `${Math.round(user.deficitKcal)} kcal deficit` : undefined}
        />
        <StatTile label="Protein target" value={user.proteinTargetG ? `${Math.round(user.proteinTargetG)}g` : "—"} />
        <StatTile label="Current weight" value={`${user.weightKg}kg`} sub={`Goal: ${user.targetWeightKg}kg`} />
      </div>

      {mealPlanCount === 0 ? (
        <Card className="flex flex-col items-start gap-2 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">You don&apos;t have a diet plan for this week yet.</p>
          <Link href="/plan">
            <Button>Generate my weekly plan</Button>
          </Link>
        </Card>
      ) : (
        <Card className="flex items-center justify-between bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">This week&apos;s plan is ready.</p>
          <Link href="/plan">
            <Button variant="secondary">View plan</Button>
          </Link>
        </Card>
      )}

      <WeightTracker
        userId={user.id}
        targetWeightKg={user.targetWeightKg}
        logs={weightLogs.map((l) => ({ id: l.id, weightKg: l.weightKg, loggedAt: l.loggedAt.toISOString() }))}
      />
      <WaterTracker userId={user.id} totalMl={totalWaterMl} />
    </div>
  );
}
