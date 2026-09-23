@php
    $allergyPresets = ['Peanuts', 'Tree nuts', 'Dairy', 'Gluten', 'Soy', 'Shellfish', 'Eggs'];
    $cuisinePresets = ['North Indian', 'South Indian', 'Chinese', 'Italian', 'Mediterranean', 'Continental', 'Mexican', 'Thai'];
    $currentAllergies = is_array($user->allergies) ? implode(', ', $user->allergies) : '';
    $currentCuisines = is_array($user->cuisine_preference) ? implode(', ', $user->cuisine_preference) : '';
@endphp
<x-layouts.app title="Food preferences · NutriPing">
    <div class="flex flex-col gap-4 pt-2">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">🍽️ Food preferences</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">What you eat, and what you love</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'diet') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label class="mb-1 block text-sm font-medium">Diet type</label>
                    <div class="grid grid-cols-2 gap-2">
                        @foreach (['NON_VEG' => ['🍗', 'Non-veg'], 'VEG' => ['🥦', 'Vegetarian'], 'VEGAN' => ['🌱', 'Vegan'], 'EGGETARIAN' => ['🥚', 'Eggetarian']] as $value => [$emoji, $label])
                            <label class="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                <input type="radio" name="diet_type" value="{{ $value }}" {{ old('diet_type', $user->diet_type) === $value ? 'checked' : '' }} required class="sr-only">
                                {{ $emoji }} {{ $label }}
                            </label>
                        @endforeach
                    </div>
                    @error('diet_type')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium">Allergies <span class="text-[var(--color-charcoal-muted)]">— optional</span></label>
                    <div class="chip-group" data-for="allergies">
                        @foreach ($allergyPresets as $preset)
                            <button type="button" class="chip" data-value="{{ $preset }}">{{ $preset }}</button>
                        @endforeach
                    </div>
                    <input type="hidden" id="allergies" name="allergies" value="{{ old('allergies', $currentAllergies) }}">
                    <div data-chip-add-for="allergies" class="mt-2 flex gap-2">
                        <input type="text" data-chip-add-input placeholder="Add another…"
                            class="flex-1 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        <button type="button" data-chip-add-button class="rounded-xl bg-[var(--color-cream-deep)] px-3 text-sm font-medium">+ Add</button>
                    </div>
                </div>

                <div>
                    <label class="mb-2 block text-sm font-medium">Preferred cuisines <span class="text-[var(--color-charcoal-muted)]">— optional</span></label>
                    <div class="chip-group" data-for="cuisine_preference">
                        @foreach ($cuisinePresets as $preset)
                            <button type="button" class="chip" data-value="{{ $preset }}">{{ $preset }}</button>
                        @endforeach
                    </div>
                    <input type="hidden" id="cuisine_preference" name="cuisine_preference" value="{{ old('cuisine_preference', $currentCuisines) }}">
                    <div data-chip-add-for="cuisine_preference" class="mt-2 flex gap-2">
                        <input type="text" data-chip-add-input placeholder="Add another…"
                            class="flex-1 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        <button type="button" data-chip-add-button class="rounded-xl bg-[var(--color-cream-deep)] px-3 text-sm font-medium">+ Add</button>
                    </div>
                </div>

                <div>
                    <label for="food_likes" class="mb-1 block text-sm font-medium">😋 Foods you love</label>
                    <textarea id="food_likes" name="food_likes" rows="2" placeholder="e.g. paneer tikka, dal, mango"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('food_likes', $user->food_likes) }}</textarea>
                </div>

                <div>
                    <label for="food_dislikes" class="mb-1 block text-sm font-medium">🙅 Foods you avoid</label>
                    <textarea id="food_dislikes" name="food_dislikes" rows="2" placeholder="e.g. mushrooms, bitter gourd"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('food_dislikes', $user->food_dislikes) }}</textarea>
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
