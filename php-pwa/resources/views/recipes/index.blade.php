<x-layouts.app title="My Recipes · NutriPing" :nav="true">
    <div class="flex flex-col gap-4 pt-2">
        <h1 class="text-xl font-bold text-[var(--color-charcoal)]">📝 My Recipes</h1>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">
                {{ session('status') }}
            </div>
        @endif

        <x-card>
            <form method="POST" action="{{ route('recipes.store') }}" class="flex flex-col gap-3">
                @csrf

                <input type="url" name="recipe_url" placeholder="🔗 Paste a recipe link…" value="{{ old('recipe_url') }}"
                    class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                @error('recipe_url')<p class="text-xs text-red-600">{{ $message }}</p>@enderror

                <div class="flex items-center gap-2 text-xs text-[var(--color-charcoal-muted)]">
                    <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
                    or
                    <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
                </div>

                <textarea name="raw_input" rows="4" placeholder="Paste the recipe text…"
                    class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('raw_input') }}</textarea>
                @error('raw_input')<p class="text-xs text-red-600">{{ $message }}</p>@enderror

                <x-button type="submit">✨ Add with AI</x-button>
            </form>
        </x-card>

        <div class="flex flex-col gap-3">
            @forelse ($recipes as $recipe)
                <x-card class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-1.5">
                            <h3 class="font-semibold text-[var(--color-charcoal)]">{{ $recipe->name }}</h3>
                            @if ($recipe->meal_type)
                                <span class="rounded-full bg-[var(--color-orange-light)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-orange-dark)]">{{ ucfirst(strtolower($recipe->meal_type)) }}</span>
                            @endif
                            <span class="text-[11px] text-[var(--color-charcoal-muted)]">
                                @if ($recipe->source === 'WEB_URL') 🔗 link @else ✍️ pasted @endif
                            </span>
                        </div>
                        <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">
                            {{ $recipe->calories ? round($recipe->calories) . ' kcal' : 'Calories unknown' }}
                            @if ($recipe->protein_g) &middot; {{ round($recipe->protein_g) }}g protein @endif
                        </p>
                    </div>
                    <form method="POST" action="{{ route('recipes.destroy', $recipe) }}" onsubmit="return confirm('Remove this recipe?');">
                        @csrf
                        @method('DELETE')
                        <button type="submit" aria-label="Remove" class="flex h-7 w-7 items-center justify-center rounded-full text-red-500">
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
                        </button>
                    </form>
                </x-card>
            @empty
                <div class="flex flex-col items-center gap-2 py-10 text-center">
                    <div class="text-4xl">🍽️</div>
                    <p class="text-sm text-[var(--color-charcoal-muted)]">No recipes yet — paste one or add a link above.</p>
                </div>
            @endforelse
        </div>
    </div>
</x-layouts.app>
