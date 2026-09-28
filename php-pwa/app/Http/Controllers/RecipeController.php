<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Services\RecipeParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\View\View;
use RuntimeException;
use Throwable;

class RecipeController extends Controller
{
    public function index(Request $request): View
    {
        return view('recipes.index', [
            'recipes' => $request->user()->recipes()->latest()->get(),
        ]);
    }

    public function store(Request $request, RecipeParser $parser): RedirectResponse
    {
        $validated = $request->validate([
            'raw_input' => ['nullable', 'string', 'min:20', 'max:8000'],
            'recipe_url' => ['nullable', 'url', 'max:2000'],
        ]);

        if (empty($validated['raw_input']) && empty($validated['recipe_url'])) {
            return back()->withErrors(['raw_input' => 'Paste a recipe or add a link.'])->withInput();
        }

        $sourceUrl = $validated['recipe_url'] ?? null;
        $textToParse = $validated['raw_input'] ?? null;
        $source = 'MANUAL_TEXT';

        if ($sourceUrl) {
            try {
                $textToParse = $this->fetchPageText($sourceUrl);
            } catch (Throwable $e) {
                return back()->withErrors(['recipe_url' => $e->getMessage()])->withInput();
            }
            $source = 'WEB_URL';
        }

        try {
            $parsed = $parser->parse($textToParse);
        } catch (Throwable $e) {
            return back()->withErrors(['raw_input' => $e->getMessage()])->withInput();
        }

        $request->user()->recipes()->create([
            'name' => $parsed['name'],
            'source' => $source,
            'source_url' => $sourceUrl,
            'raw_input' => $validated['raw_input'] ?? null,
            'meal_type' => $parsed['meal_type'],
            'ingredients' => $parsed['ingredients'],
            'instructions' => $parsed['instructions'],
            'calories' => $parsed['calories'],
            'protein_g' => $parsed['protein_g'],
            'carbs_g' => $parsed['carbs_g'],
            'fat_g' => $parsed['fat_g'],
            'fiber_g' => $parsed['fiber_g'],
            'ai_estimated' => true,
        ]);

        return redirect()->route('recipes.index')->with('status', 'Recipe added!');
    }

    public function destroy(Request $request, Recipe $recipe): RedirectResponse
    {
        abort_unless($recipe->user_id === $request->user()->id, 403);

        $recipe->delete();

        return redirect()->route('recipes.index')->with('status', 'Recipe removed.');
    }

    protected function fetchPageText(string $url): string
    {
        try {
            $response = Http::withHeaders([
                'User-Agent' => 'Mozilla/5.0 (compatible; NutriPingBot/1.0)',
            ])->timeout(20)->get($url);
        } catch (Throwable) {
            throw new RuntimeException('Could not reach that link. Check the URL, or try pasting the recipe text instead.');
        }

        if ($response->failed()) {
            throw new RuntimeException('Could not load that page (' . $response->status() . '). Try pasting the recipe text instead.');
        }

        $html = $response->body();
        $html = preg_replace('/<(script|style)\b[^>]*>.*?<\/\1>/is', ' ', $html);
        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES, 'UTF-8');
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/\n{2,}/', "\n", trim($text));

        if (mb_strlen($text) < 50) {
            throw new RuntimeException('Could not find recipe content on that page. Try pasting the recipe text instead.');
        }

        return mb_substr($text, 0, 12000);
    }
}
