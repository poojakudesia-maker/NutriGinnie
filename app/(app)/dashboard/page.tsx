import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { bmiCategory } from "@/lib/calculations";
import { weekStartDate } from "@/lib/utils";
import { StatTile } from "@/components/dashboard/StatTile";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import PdfUploadForm from "@/components/settings/PdfUploadForm";
import RecipeForm from "@/components/settings/RecipeForm";
import GeneratePlanButton from "@/components/plan/GeneratePlanButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // (app) layout already redirects when there's no session

  const weekStart = weekStartDate();
  const mealPlanCount = await prisma.mealPlan.count({ where: { userId: user.id, weekStartDate: weekStart } });

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
        <StatTile
          label="Current weight"
          value={user.weightKg != null ? `${user.weightKg}kg` : "—"}
          sub={user.targetWeightKg != null ? `Goal: ${user.targetWeightKg}kg` : undefined}
        />
      </div>

      <PdfUploadForm userId={user.id} />
      <RecipeForm userId={user.id} />

      {mealPlanCount === 0 ? (
        <Card className="flex flex-col items-start gap-2 bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">
            Ready to build your diet plan? AI will generate 7 days of meals matched to your calorie and protein
            targets, using anything you&apos;ve uploaded or added above.
          </p>
          <GeneratePlanButton userId={user.id} />
        </Card>
      ) : (
        <Card className="flex items-center justify-between bg-emerald-50">
          <p className="text-sm font-medium text-emerald-800">This week&apos;s plan is ready.</p>
          <Link href="/plan">
            <Button variant="secondary">View plan</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
