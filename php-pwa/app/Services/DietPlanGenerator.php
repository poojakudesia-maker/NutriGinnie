<?php

namespace App\Services;

use App\Models\MealPlan;
use App\Models\User;
use App\Services\Anthropic\AnthropicClient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class DietPlanGenerator
{
    protected const SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];

    protected const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    public function __construct(protected AnthropicClient $client)
    {
    }

    /**
     * Generate (or regenerate) a full week of meal plans + grocery lists for the user,
     * blending their saved recipes, an optional dietitian PDF, and AI generation.
     *
     * @return Carbon the week_start_date the plan was saved under
     */
    public function generateWeek(User $user, ?Carbon $weekStart = null): Carbon
    {
        $weekStart = ($weekStart ?? Carbon::now($user->timezone ?: 'Asia/Kolkata'))->copy()->startOfWeek(Carbon::MONDAY);

        $recipes = $user->recipes()->get(['id', 'name', 'meal_type', 'calories', 'protein_g', 'carbs_g', 'fat_g']);

        $messageContent = [];
        if ($user->has_dietitian && $user->dietitian_pdf_path && Storage::disk('public')->exists($user->dietitian_pdf_path)) {
            $pdfBytes = Storage::disk('public')->get($user->dietitian_pdf_path);
            $messageContent[] = AnthropicClient::documentBlock(base64_encode($pdfBytes));
        }

        $messageContent[] = ['type' => 'text', 'text' => $this->buildPrompt($user, $recipes)];

        $text = $this->client->textResponse(
            messages: [['role' => 'user', 'content' => $messageContent]],
            system: $this->systemPrompt(),
            maxTokens: 8192,
            temperature: 0.5,
        );

        $data = AnthropicClient::extractJson($text);

        if ($data === null || empty($data['days']) || ! is_array($data['days'])) {
            throw new RuntimeException('The AI could not generate a weekly plan. Please try again.');
        }

        $this->persist($user, $weekStart, $data['days']);

        return $weekStart;
    }

    protected function systemPrompt(): string
    {
        return <<<'SYSTEM'
            You are a registered-dietitian-quality meal planning assistant. Build a 7-day meal
            plan (Monday-Sunday) for the user described in the next message, using their saved
            recipes where they fit and generating new AI meals to fill any gaps. If a dietitian's
            PDF diet plan is attached, use it as the primary source of truth and blend AI-generated
            meals around it to fill the week and hit the calorie/macro targets.

            Respect the user's diet type, allergies, and dislikes strictly — never include an
            allergen or disliked ingredient. Favor their liked foods and preferred cuisines.
            Keep each day's total calories close to their daily calorie target (within ~10%).

            Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly:
            {
              "days": [
                {
                  "day_index": 0,
                  "day_label": "Monday",
                  "meals": {
                    "breakfast": {"name": string, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number, "source": "recipe:<id>" | "ai" | "dietitian", "instructions": string|null},
                    "snack1": { ...same shape... },
                    "lunch": { ...same shape... },
                    "snack2": { ...same shape... },
                    "dinner": { ...same shape... }
                  },
                  "total_calories": number,
                  "total_protein_g": number,
                  "total_carbs_g": number,
                  "total_fat_g": number,
                  "groceries": [{"name": string, "quantity": string, "unit": string, "category": string}]
                }
              ]
            }

            "days" must have exactly 7 entries, day_index 0 through 6 for Monday through Sunday.
            When a meal comes from one of the user's saved recipes, set source to "recipe:<id>"
            using the id given and leave instructions null. Otherwise set source to "ai" (or
            "dietitian" when taken directly from the attached PDF) and include brief instructions.
            SYSTEM;
    }

    protected function buildPrompt(User $user, $recipes): string
    {
        $lines = [];
        $lines[] = 'User profile:';
        $lines[] = "- Diet type: {$user->diet_type}";
        $lines[] = '- Allergies: ' . ($user->allergies ? implode(', ', $user->allergies) : 'none');
        $lines[] = '- Preferred cuisines: ' . ($user->cuisine_preference ? implode(', ', $user->cuisine_preference) : 'no preference');
        $lines[] = '- Likes: ' . ($user->food_likes ?: 'not specified');
        $lines[] = '- Dislikes: ' . ($user->food_dislikes ?: 'not specified');
        $lines[] = "- Daily calorie target: {$user->calorie_target} kcal";
        $lines[] = "- Daily macro targets: {$user->protein_target_g}g protein / {$user->carb_target_g}g carbs / {$user->fat_target_g}g fat";
        if ($user->is_glp1) {
            $lines[] = '- On GLP-1 medication: favor smaller, protein-rich, easy-to-digest meals.';
        }

        $lines[] = '';
        if ($recipes->isNotEmpty()) {
            $lines[] = "User's saved recipes (use these ids in \"source\" when you use one):";
            foreach ($recipes as $recipe) {
                $lines[] = sprintf(
                    '- id=%d, name="%s", meal_type=%s, calories=%s',
                    $recipe->id,
                    $recipe->name,
                    $recipe->meal_type ?? 'any',
                    $recipe->calories !== null ? round($recipe->calories) : 'unknown',
                );
            }
        } else {
            $lines[] = 'The user has no saved recipes yet — generate all meals with AI.';
        }

        return implode("\n", $lines);
    }

    protected function persist(User $user, Carbon $weekStart, array $days): void
    {
        DB::transaction(function () use ($user, $weekStart, $days) {
            MealPlan::where('user_id', $user->id)->where('week_start_date', $weekStart->toDateString())->delete();
            $user->groceries()->whereBetween('for_date', [$weekStart->toDateString(), $weekStart->copy()->addDays(6)->toDateString()])->delete();

            foreach ($days as $day) {
                $dayIndex = (int) ($day['day_index'] ?? 0);
                $dayIndex = max(0, min(6, $dayIndex));
                $forDate = $weekStart->copy()->addDays($dayIndex);

                $meals = [];
                foreach (self::SLOTS as $slot) {
                    $meal = $day['meals'][$slot] ?? null;
                    $meals[$slot] = [
                        'name' => $meal['name'] ?? 'TBD',
                        'calories' => isset($meal['calories']) ? (float) $meal['calories'] : 0,
                        'protein_g' => isset($meal['protein_g']) ? (float) $meal['protein_g'] : 0,
                        'carbs_g' => isset($meal['carbs_g']) ? (float) $meal['carbs_g'] : 0,
                        'fat_g' => isset($meal['fat_g']) ? (float) $meal['fat_g'] : 0,
                        'source' => $meal['source'] ?? 'ai',
                        'instructions' => $meal['instructions'] ?? null,
                    ];
                }

                MealPlan::create([
                    'user_id' => $user->id,
                    'week_start_date' => $weekStart->toDateString(),
                    'day_index' => $dayIndex,
                    'day_label' => self::DAY_LABELS[$dayIndex],
                    'meals' => $meals,
                    'total_calories' => $day['total_calories'] ?? collect($meals)->sum('calories'),
                    'total_protein_g' => $day['total_protein_g'] ?? collect($meals)->sum('protein_g'),
                    'total_carbs_g' => $day['total_carbs_g'] ?? collect($meals)->sum('carbs_g'),
                    'total_fat_g' => $day['total_fat_g'] ?? collect($meals)->sum('fat_g'),
                ]);

                $user->groceries()->create([
                    'for_date' => $forDate->toDateString(),
                    'items' => is_array($day['groceries'] ?? null) ? $day['groceries'] : [],
                ]);
            }
        });
    }
}
