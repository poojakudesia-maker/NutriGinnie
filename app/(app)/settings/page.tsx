import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import WhatsAppSettingsForm from "@/components/settings/WhatsAppSettingsForm";
import PdfUploadForm from "@/components/settings/PdfUploadForm";
import RecipeForm from "@/components/settings/RecipeForm";
import LogoutButton from "@/components/settings/LogoutButton";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const recipes = await prisma.recipe.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-charcoal">Settings</h1>

      <WhatsAppSettingsForm userId={user.id} initialNumbers={user.whatsappNumbers} />
      <PdfUploadForm userId={user.id} />
      <RecipeForm userId={user.id} />

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-charcoal">Your saved recipes ({recipes.length})</h2>
        {recipes.length === 0 ? (
          <p className="text-xs text-charcoal-muted">No recipes yet. Upload a PDF or paste one above.</p>
        ) : (
          <ul className="divide-y divide-warm-border text-sm">
            {recipes.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-charcoal">{r.name}</p>
                  <p className="text-xs text-charcoal-muted">
                    {r.source} {r.aiEstimated ? "· AI-estimated nutrition" : ""}
                  </p>
                </div>
                <span className="text-xs text-charcoal-muted">{r.calories ? `${Math.round(r.calories)} kcal` : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <LogoutButton />

      <p className="text-center text-xs text-charcoal-muted/70">NutriPing v1.0 · Made for consistent, sustainable progress</p>
    </div>
  );
}
