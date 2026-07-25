import type { DayPlan, GroceryItem, StructuredIngredient } from "../ai/types";

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: ["onion", "tomato", "spinach", "palak", "capsicum", "carrot", "cucumber", "lemon", "banana", "apple", "papaya", "coriander", "mint", "ginger", "garlic", "chili", "beans", "gourd", "cabbage", "cauliflower", "potato"],
  dairy: ["milk", "curd", "yogurt", "paneer", "cheese", "ghee", "butter"],
  grains: ["rice", "atta", "flour", "oats", "poha", "dalia", "bread", "quinoa", "millet", "bajra", "jowar"],
  protein: ["dal", "lentil", "chicken", "egg", "fish", "prawn", "soya", "tofu", "chana", "rajma", "moong", "sprouts"],
  spices: ["masala", "powder", "jeera", "haldi", "turmeric", "salt", "cumin", "coriander seed", "mustard seed", "hing"],
};

function categorize(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "other";
}

/** Normalizes an ingredient name + unit for dedup/merge keys (case/whitespace insensitive). */
function normalizeKey(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}::${unit.trim().toLowerCase()}`;
}

/**
 * Aggregates ingredients across all meals of a single day into a
 * deduplicated grocery list with summed quantities, grouped by category.
 */
export function buildGroceryListForDay(day: DayPlan): GroceryItem[] {
  const allIngredients: StructuredIngredient[] = [
    ...day.meals.breakfast.ingredients,
    ...day.meals.snack1.ingredients,
    ...day.meals.lunch.ingredients,
    ...day.meals.snack2.ingredients,
    ...day.meals.dinner.ingredients,
  ];

  const merged = new Map<string, GroceryItem>();

  for (const ing of allIngredients) {
    if (!ing?.name) continue;
    const key = normalizeKey(ing.name, ing.unit || "unit");
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += ing.quantity || 0;
    } else {
      merged.set(key, {
        name: ing.name.trim(),
        quantity: ing.quantity || 0,
        unit: ing.unit || "unit",
        category: categorize(ing.name),
      });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}
