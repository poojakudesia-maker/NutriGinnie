<x-layouts.app title="Your basics · NutriPing">
    <div class="flex flex-col gap-4 pt-6">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Tell us about you</h1>
            <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">We'll use this to calculate your BMI, calories, and workout targets.</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'basics') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="age" class="mb-1 block text-sm font-medium">Age</label>
                    <input id="age" name="age" type="number" min="10" max="100" value="{{ old('age', $user->age) }}" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('age')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium">Gender</label>
                    <div class="flex gap-3">
                        @foreach (['MALE' => 'Male', 'FEMALE' => 'Female'] as $value => $label)
                            <label class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                <input type="radio" name="gender" value="{{ $value }}" {{ old('gender', $user->gender) === $value ? 'checked' : '' }} required class="accent-[var(--color-orange)]">
                                {{ $label }}
                            </label>
                        @endforeach
                    </div>
                    @error('gender')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="ethnicity" class="mb-1 block text-sm font-medium">Ethnicity <span class="text-[var(--color-charcoal-muted)]">(optional)</span></label>
                    <input id="ethnicity" name="ethnicity" type="text" value="{{ old('ethnicity', $user->ethnicity) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="height_cm" class="mb-1 block text-sm font-medium">Height (cm)</label>
                        <input id="height_cm" name="height_cm" type="number" step="0.1" min="100" max="250" value="{{ old('height_cm', $user->height_cm) }}" required
                            class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        @error('height_cm')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    </div>
                    <div>
                        <label for="weight_kg" class="mb-1 block text-sm font-medium">Weight (kg)</label>
                        <input id="weight_kg" name="weight_kg" type="number" step="0.1" min="30" max="300" value="{{ old('weight_kg', $user->weight_kg) }}" required
                            class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        @error('weight_kg')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    </div>
                </div>

                <div>
                    <label for="target_weight_kg" class="mb-1 block text-sm font-medium">Target weight (kg) <span class="text-[var(--color-charcoal-muted)]">(optional)</span></label>
                    <input id="target_weight_kg" name="target_weight_kg" type="number" step="0.1" min="30" max="300" value="{{ old('target_weight_kg', $user->target_weight_kg) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <div>
                    <label for="activity_level" class="mb-1 block text-sm font-medium">Activity level</label>
                    <select id="activity_level" name="activity_level" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        <option value="">Select...</option>
                        @foreach (['SEDENTARY' => 'Sedentary (little or no exercise)', 'LIGHT' => 'Light (1-3 days/week)', 'MODERATE' => 'Moderate (3-5 days/week)', 'HIGH' => 'High (6-7 days/week)'] as $value => $label)
                            <option value="{{ $value }}" {{ old('activity_level', $user->activity_level) === $value ? 'selected' : '' }}>{{ $label }}</option>
                        @endforeach
                    </select>
                    @error('activity_level')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
