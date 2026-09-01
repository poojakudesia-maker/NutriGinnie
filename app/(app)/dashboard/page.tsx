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
import { RecipeList } from "@/components/recipes/RecipeList";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null; // (app) layout already redirects when there's no session

  const weekStart = weekStartDate();
  const [mealPlanCount, recipes] = await Promise.all([
    prisma.mealPlan.count({ where: { userId: user.id, weekStartDate: weekStart } }),
    prisma.recipe.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const recipeCount = recipes.length;

  const calorieProgressPct =
    user.calorieTarget && user.tdee ? Math.min(100, Math.round((user.calorieTarget / user.tdee) * 100)) : null;

  return (
    <div className="space-y-4">
      <div className="gradient-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_16px_40px_-12px_rgba(217,88,31,0.5)]">
        <p className="text-sm font-medium text-white/85">Welcome back</p>
        <h1 className="text-2xl font-bold">Hi {user.name} 👋</h1>
        <p className="mt-1 text-sm text-white/85">Here&apos;s where your plan stands today.</p>

        {calorieProgressPct !== null && (
          <div className="mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">Today&apos;s calorie target</p>
            <p className="mt-1 text-3xl font-bold">{Math.round(user.calorieTarget!)} kcal</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${calorieProgressPct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-white/80">
              {Math.round(user.calorieTarget!)} / {Math.round(user.tdee!)} kcal TDEE · {Math.round(user.deficitKcal ?? 0)} kcal deficit
            </p>
          </div>
        )}
      </div>

      {user.isGlp1 && (
        <div className="rounded-2xl bg-sage-light px-3 py-2 text-xs font-medium text-sage">
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
        {user.carbTargetG != null && <StatTile label="Carb target" value={`${Math.round(user.carbTargetG)}g`} />}
        {user.fatTargetG != null && <StatTile label="Fat target" value={`${Math.round(user.fatTargetG)}g`} />}
        <StatTile
          label="Current weight"
          value={user.weightKg != null ? `${user.weightKg}kg` : "—"}
          sub={user.targetWeightKg != null ? `Goal: ${user.targetWeightKg}kg` : undefined}
        />
      </div>

      <PdfUploadForm userId={user.id} />
      <RecipeForm userId={user.id} />
      <RecipeList userId={user.id} recipes={recipes} />

      {mealPlanCount === 0 ? (
        <Card className="flex flex-col items-start gap-2 bg-orange-light">
          <p className="text-sm font-medium text-orange-dark">
            {recipeCount > 0
              ? `Ready to build your diet plan? We'll assemble 7 days directly from your ${recipeCount} uploaded recipe${recipeCount === 1 ? "" : "s"} above — no AI needed unless you ask for it.`
              : "Ready to build your diet plan? Upload a PDF/DOCX or add recipes above to build from those, or generate an AI-created plan now."}
          </p>
          <GeneratePlanButton userId={user.id} hasRecipes={recipeCount > 0} />
        </Card>
      ) : (
        <Card className="flex items-center justify-between bg-orange-light">
          <p className="text-sm font-medium text-orange-dark">This week&apos;s plan is ready.</p>
          <Link href="/plan">
            <Button variant="secondary">View plan</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
