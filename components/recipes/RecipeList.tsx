import { Card } from "@/components/ui/Card";
import { RecipeCard, type RecipeCardData } from "./RecipeCard";

export function RecipeList({ recipes, title }: { recipes: RecipeCardData[]; title?: string }) {
  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-charcoal">{title ?? `Your uploaded diet plan (${recipes.length})`}</h2>
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
