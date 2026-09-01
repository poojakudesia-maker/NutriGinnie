import { Card } from "@/components/ui/Card";
import { RecipeCard, type RecipeCardData } from "./RecipeCard";
import { ClearAllRecipesButton } from "./ClearAllRecipesButton";

export function RecipeList({ userId, recipes, title }: { userId: string; recipes: RecipeCardData[]; title?: string }) {
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-charcoal">{title ?? `Your uploaded diet plan (${recipes.length})`}</h2>
        {recipes.length > 0 && <ClearAllRecipesButton userId={userId} />}
      </div>
      {recipes.length === 0 ? (
        <p className="text-xs text-charcoal-muted">
          No dishes yet — upload a PDF/DOCX or add a recipe above and they&apos;ll show up here.
        </p>
      ) : (
        <div>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </Card>
  );
}
