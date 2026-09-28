<?php

namespace App\Services\WhatsApp;

use App\Models\MealPlan;
use App\Models\User;
use Illuminate\Support\Collection;

class WhatsAppMessageFormatter
{
    protected const SLOT_LABELS = [
        'breakfast' => ['🥣', 'Breakfast'],
        'snack1' => ['🍎', 'Mid-morning snack'],
        'lunch' => ['🍛', 'Lunch'],
        'snack2' => ['🥤', 'Evening snack'],
        'dinner' => ['🍲', 'Dinner'],
    ];

    /**
     * The single nightly message: tomorrow's diet plan + grocery list combined.
     *
     * @param  Collection<int, array<string, mixed>>  $groceryItems
     */
    public static function dietAndGrocery(User $user, MealPlan $day, Collection $groceryItems): string
    {
        $lines = [];
        $lines[] = "Hi {$user->name}! 🌙 Here's tomorrow's plan — *{$day->day_label}*:";
        $lines[] = '';

        foreach (self::SLOT_LABELS as $slot => [$emoji, $label]) {
            $meal = $day->meals[$slot] ?? null;
            if (! $meal) {
                continue;
            }
            $lines[] = "{$emoji} *{$label}*: {$meal['name']} (" . round($meal['calories']) . ' kcal, ' . round($meal['protein_g']) . 'g protein)';
        }

        $lines[] = '';
        $lines[] = sprintf(
            '📊 Total: *%d kcal* | Protein: *%dg* | Carbs: %dg | Fat: %dg',
            round($day->total_calories),
            round($day->total_protein_g),
            round($day->total_carbs_g),
            round($day->total_fat_g),
        );

        $lines[] = '';
        $lines[] = '🛒 *Grocery list for tomorrow*';
        $lines[] = '';

        $byCategory = $groceryItems->groupBy(fn ($item) => $item['category'] ?? 'Other');
        foreach ($byCategory as $category => $items) {
            $lines[] = '_' . ucfirst(strtolower($category)) . '_';
            foreach ($items as $item) {
                $lines[] = '• ' . ($item['name'] ?? '') . ' — ' . ($item['quantity'] ?? '') . ($item['unit'] ?? '');
            }
            $lines[] = '';
        }

        $lines[] = 'Get these ready tonight — stay consistent! 💪';

        return implode("\n", $lines);
    }

    /**
     * Meta's Cloud API rejects template body parameters containing newlines,
     * tabs, or 4+ consecutive spaces (error 132018) — the template's own fixed
     * text may have line breaks, but a variable value may not. Converts the
     * pretty multi-line message into one WhatsApp-safe line, and keeps it
     * under the ~1024 character template body limit.
     */
    public static function forTemplateParam(string $text, int $maxLength = 1000): string
    {
        $flat = preg_replace('/\s*\n\s*/', '  •  ', trim($text));
        $flat = preg_replace('/[\t\r]+/', ' ', $flat);
        $flat = preg_replace('/(  •  ){2,}/', '  •  ', $flat);
        $flat = preg_replace('/ {4,}/', '   ', $flat);

        if (mb_strlen($flat) > $maxLength) {
            $flat = mb_substr($flat, 0, $maxLength - 1) . '…';
        }

        return $flat;
    }
}
