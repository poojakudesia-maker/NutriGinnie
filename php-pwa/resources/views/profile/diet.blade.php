<x-layouts.app title="Food preferences · NutriPing">
    <div class="flex flex-col gap-4 pt-6">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Food preferences</h1>
            <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">Tell us what you eat, and what you love (or hate).</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'diet') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label class="mb-1 block text-sm font-medium">Diet type</label>
                    <div class="grid grid-cols-2 gap-2">
                        @foreach (['NON_VEG' => 'Non-vegetarian', 'VEG' => 'Vegetarian', 'VEGAN' => 'Vegan', 'EGGETARIAN' => 'Eggetarian'] as $value => $label)
                            <label class="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                <input type="radio" name="diet_type" value="{{ $value }}" {{ old('diet_type', $user->diet_type) === $value ? 'checked' : '' }} required class="accent-[var(--color-orange)]">
                                {{ $label }}
                            </label>
                        @endforeach
                    </div>
                    @error('diet_type')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="allergies" class="mb-1 block text-sm font-medium">Allergies <span class="text-[var(--color-charcoal-muted)]">(optional, comma separated)</span></label>
                    <input id="allergies" name="allergies" type="text" placeholder="e.g. peanuts, shellfish" value="{{ old('allergies', is_array($user->allergies) ? implode(', ', $user->allergies) : null) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <div>
                    <label for="cuisine_preference" class="mb-1 block text-sm font-medium">Preferred cuisines <span class="text-[var(--color-charcoal-muted)]">(optional, comma separated)</span></label>
                    <input id="cuisine_preference" name="cuisine_preference" type="text" placeholder="e.g. North Indian, Mediterranean" value="{{ old('cuisine_preference', is_array($user->cuisine_preference) ? implode(', ', $user->cuisine_preference) : null) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <div>
                    <label for="food_likes" class="mb-1 block text-sm font-medium">Foods you love</label>
                    <textarea id="food_likes" name="food_likes" rows="3" placeholder="e.g. paneer tikka, dal, mango"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('food_likes', $user->food_likes) }}</textarea>
                </div>

                <div>
                    <label for="food_dislikes" class="mb-1 block text-sm font-medium">Foods you avoid</label>
                    <textarea id="food_dislikes" name="food_dislikes" rows="3" placeholder="e.g. mushrooms, bitter gourd"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('food_dislikes', $user->food_dislikes) }}</textarea>
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
