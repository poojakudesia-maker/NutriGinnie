<?php

namespace App\Services;

use App\Services\Anthropic\AnthropicClient;
use RuntimeException;

class RecipeParser
{
    public function __construct(protected AnthropicClient $client)
    {
    }

    /**
     * Parse free-text recipe input (pasted from anywhere) into structured fields.
     *
     * @return array{name: string, meal_type: ?string, ingredients: array, instructions: ?string, calories: ?float, protein_g: ?float, carbs_g: ?float, fat_g: ?float, fiber_g: ?float}
     */
    public function parse(string $rawText): array
    {
        $system = <<<'SYSTEM'
            You are a nutrition data extraction assistant. Given free-text pasted by a user
            (which may be a recipe copied from Instagram, YouTube, a website, or typed by hand),
            extract a structured recipe and estimate its nutrition per serving.

            Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly:
            {
              "name": string,
              "meal_type": "BREAKFAST" | "SNACK" | "LUNCH" | "DINNER" | null,
              "ingredients": [{"name": string, "quantity": string, "unit": string}],
              "instructions": string | null,
              "calories": number,
              "protein_g": number,
              "carbs_g": number,
              "fat_g": number,
              "fiber_g": number
            }

            Estimate nutrition per single serving as best you can from the ingredients and
            typical preparation. If meal type isn't obvious, use your best judgement or null.
            SYSTEM;

        $text = $this->client->textResponse(
            messages: [['role' => 'user', 'content' => "Extract the recipe from this text:\n\n" . $rawText]],
            system: $system,
            maxTokens: 2048,
            temperature: 0.2,
        );

        $data = AnthropicClient::extractJson($text);

        if ($data === null || empty($data['name'])) {
            throw new RuntimeException('Could not parse a recipe from that text. Try pasting the full recipe including ingredients.');
        }

        return [
            'name' => (string) $data['name'],
            'meal_type' => in_array($data['meal_type'] ?? null, ['BREAKFAST', 'SNACK', 'LUNCH', 'DINNER'], true) ? $data['meal_type'] : null,
            'ingredients' => is_array($data['ingredients'] ?? null) ? $data['ingredients'] : [],
            'instructions' => $data['instructions'] ?? null,
            'calories' => isset($data['calories']) ? (float) $data['calories'] : null,
            'protein_g' => isset($data['protein_g']) ? (float) $data['protein_g'] : null,
            'carbs_g' => isset($data['carbs_g']) ? (float) $data['carbs_g'] : null,
            'fat_g' => isset($data['fat_g']) ? (float) $data['fat_g'] : null,
            'fiber_g' => isset($data['fiber_g']) ? (float) $data['fiber_g'] : null,
        ];
    }
}
