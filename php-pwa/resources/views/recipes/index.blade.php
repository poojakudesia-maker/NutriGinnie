<x-layouts.app title="Your recipes · NutriPing">
    <div class="flex flex-col gap-4 pt-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Your recipes</h1>
                <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">Paste in recipes you love — from Instagram, YouTube, or anywhere.</p>
            </div>
            <x-button href="{{ route('dashboard') }}" variant="ghost" class="!w-auto px-3">Back</x-button>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">
                {{ session('status') }}
            </div>
        @endif

        <x-card>
            <form method="POST" action="{{ route('recipes.store') }}" class="flex flex-col gap-3">
                @csrf
                <label for="raw_input" class="text-sm font-medium">Paste a recipe</label>
                <textarea id="raw_input" name="raw_input" rows="6" required
                    placeholder="Paste the recipe text here — ingredients and steps. Our AI will figure out the name, ingredients, and estimate calories."
                    class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('raw_input') }}</textarea>
                @error('raw_input')<p class="text-xs text-red-600">{{ $message }}</p>@enderror
                <x-button type="submit">Add recipe with AI</x-button>
            </form>
        </x-card>

        <div class="flex flex-col gap-3">
            @forelse ($recipes as $recipe)
                <x-card class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-[var(--color-charcoal)]">{{ $recipe->name }}</h3>
                            @if ($recipe->meal_type)
                                <span class="rounded-full bg-[var(--color-orange-light)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-orange-dark)]">{{ ucfirst(strtolower($recipe->meal_type)) }}</span>
                            @endif
                        </div>
                        <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">
                            {{ $recipe->calories ? round($recipe->calories) . ' kcal' : 'Calories unknown' }}
                            @if ($recipe->protein_g) &middot; {{ round($recipe->protein_g) }}g protein @endif
                        </p>
                    </div>
                    <form method="POST" action="{{ route('recipes.destroy', $recipe) }}" onsubmit="return confirm('Remove this recipe?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-xs font-semibold text-red-600">Remove</button>
                    </form>
                </x-card>
            @empty
                <p class="text-center text-sm text-[var(--color-charcoal-muted)]">No recipes yet — paste your first one above.</p>
            @endforelse
        </div>
    </div>
</x-layouts.app>
