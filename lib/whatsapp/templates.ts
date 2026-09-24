import type { DayPlan, GroceryItem } from "../ai/types";

function fmt(n: number): string {
  return Math.round(n).toString();
}

/** Short (30-60s when spoken) friendly script for the TTS voice note. */
export function formatDietPlanVoiceScript(userName: string, day: DayPlan): string {
  const { meals } = day;
  return `Good morning, ${userName}! Here's your plan for ${day.dayLabel}. \
For breakfast, have ${meals.breakfast.name}. \
Mid-morning, go for ${meals.snack1.name}. \
For lunch, enjoy ${meals.lunch.name}. \
In the evening, snack on ${meals.snack2.name}. \
And for dinner, it's ${meals.dinner.name}. \
That's about ${fmt(day.totalCalories)} calories and ${fmt(day.totalProteinG)} grams of protein for the day. \
Have a great day, and stay consistent — you've got this!`;
}

/**
 * Combined diet-plan + grocery-list message, sent at 7 PM the evening
 * before (e.g. sent Aug 4 7 PM covers Aug 5's diet + groceries). This is
 * the single nightly message — see lib/whatsapp/dispatch.ts sendNightlyPlanToUser.
 */
export function formatDietAndGroceryMessage(userName: string, day: DayPlan, groceryItems: GroceryItem[]): string {
  const { meals } = day;

  const dietLines = [
    `Hi ${userName}! 🌙 Here's tomorrow's plan — *${day.dayLabel}*:`,
    ``,
    `🥣 *Breakfast*: ${meals.breakfast.name} (${fmt(meals.breakfast.calories)} kcal, ${fmt(meals.breakfast.proteinG)}g protein)`,
    `🍎 *Mid-morning snack*: ${meals.snack1.name} (${fmt(meals.snack1.calories)} kcal)`,
    `🍛 *Lunch*: ${meals.lunch.name} (${fmt(meals.lunch.calories)} kcal, ${fmt(meals.lunch.proteinG)}g protein)`,
    `🥤 *Evening snack*: ${meals.snack2.name} (${fmt(meals.snack2.calories)} kcal)`,
    `🍲 *Dinner*: ${meals.dinner.name} (${fmt(meals.dinner.calories)} kcal, ${fmt(meals.dinner.proteinG)}g protein)`,
    ``,
    `📊 Total: *${fmt(day.totalCalories)} kcal* | Protein: *${fmt(day.totalProteinG)}g* | Carbs: ${fmt(day.totalCarbsG)}g | Fat: ${fmt(day.totalFatG)}g`,
  ];

  const byCategory = new Map<string, GroceryItem[]>();
  for (const item of groceryItems) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const groceryLines = [`🛒 *Grocery list for tomorrow*`, ``];
  for (const [category, categoryItems] of byCategory) {
    groceryLines.push(`_${capitalize(category)}_`);
    for (const item of categoryItems) {
      groceryLines.push(`• ${item.name} — ${formatQty(item.quantity)}${item.unit}`);
    }
    groceryLines.push(``);
  }

  return [...dietLines, ``, `━━━━━━━━━━━━━━━`, ``, ...groceryLines, `Get these ready tonight — stay consistent! 💪`].join("\n");
}

/** Grocery list reminder, sent the evening before (5 PM) for the next day's meals. */
export function formatGroceryMessage(userName: string, forDayLabel: string, items: GroceryItem[]): string {
  const byCategory = new Map<string, GroceryItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const lines = [`Hi ${userName}! 🛒 Here's your grocery list for *${forDayLabel}*:`, ``];
  for (const [category, categoryItems] of byCategory) {
    lines.push(`*${capitalize(category)}*`);
    for (const item of categoryItems) {
      lines.push(`• ${item.name} — ${formatQty(item.quantity)}${item.unit}`);
    }
    lines.push(``);
  }
  lines.push(`Get these ready today so tomorrow's cooking is stress-free! 🙌`);
  return lines.join("\n");
}

function formatQty(q: number): string {
  return Number.isInteger(q) ? q.toString() : q.toFixed(1);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
