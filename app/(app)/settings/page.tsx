import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import WhatsAppSettingsForm from "@/components/settings/WhatsAppSettingsForm";
import DeliveryPreferencesForm from "@/components/settings/DeliveryPreferencesForm";
import PdfUploadForm from "@/components/settings/PdfUploadForm";
import RecipeForm from "@/components/settings/RecipeForm";
import LogoutButton from "@/components/settings/LogoutButton";
import { RecipeList } from "@/components/recipes/RecipeList";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const recipes = await prisma.recipe.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-charcoal">Settings</h1>

      <WhatsAppSettingsForm userId={user.id} initialNumbers={user.whatsappNumbers} />
      <DeliveryPreferencesForm
        userId={user.id}
        initialTimezone={user.timezone}
        initialDispatchHour={user.dispatchHour}
        initialEnabled={user.whatsappRemindersEnabled}
      />
      <PdfUploadForm userId={user.id} />
      <RecipeForm userId={user.id} />
      <RecipeList userId={user.id} recipes={recipes} title={`Your saved recipes (${recipes.length})`} />

      <LogoutButton />

      <p className="text-center text-xs text-charcoal-muted/70">NutriPing v1.0 · Made for consistent, sustainable progress</p>
    </div>
  );
}
