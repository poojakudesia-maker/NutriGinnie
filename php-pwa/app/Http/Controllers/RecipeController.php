<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use App\Services\RecipeParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
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
            'raw_input' => ['required', 'string', 'min:20', 'max:8000'],
        ]);

        try {
            $parsed = $parser->parse($validated['raw_input']);
        } catch (Throwable $e) {
            return back()->withErrors(['raw_input' => $e->getMessage()])->withInput();
        }

        $request->user()->recipes()->create([
            'name' => $parsed['name'],
            'source' => 'MANUAL_TEXT',
            'raw_input' => $validated['raw_input'],
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
}
