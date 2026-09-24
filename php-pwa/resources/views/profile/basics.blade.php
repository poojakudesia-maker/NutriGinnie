@php
    $ethnicityPresets = ['South Asian', 'East Asian', 'Southeast Asian', 'Black / African', 'Hispanic / Latino', 'Middle Eastern', 'White / Caucasian'];
    $currentEthnicity = old('ethnicity', $user->ethnicity);
    $ethnicityIsOther = $currentEthnicity && ! in_array($currentEthnicity, $ethnicityPresets, true);
@endphp
<x-layouts.app title="Your basics · NutriPing">
    <div class="flex flex-col gap-4 pt-2">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">👋 Tell us about you</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">For your BMI, calories &amp; workout targets</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'basics') }}" class="flex flex-col gap-4">
                @csrf
                @if ($editMode ?? false)<input type="hidden" name="edit" value="1">@endif

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label for="age" class="mb-1 block text-sm font-medium">Age</label>
                        <input id="age" name="age" type="number" min="10" max="100" value="{{ old('age', $user->age) }}" required
                            class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        @error('age')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Gender</label>
                        <div class="flex gap-1.5">
                            @foreach (['MALE' => '♂ Male', 'FEMALE' => '♀ Female'] as $value => $label)
                                <label class="flex flex-1 items-center justify-center rounded-xl border border-[var(--color-warm-border)] bg-white py-2.5 text-sm has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                    <input type="radio" name="gender" value="{{ $value }}" {{ old('gender', $user->gender) === $value ? 'checked' : '' }} required class="sr-only">
                                    {{ $label }}
                                </label>
                            @endforeach
                        </div>
                    </div>
                </div>
                @error('gender')<p class="text-xs text-red-600">{{ $message }}</p>@enderror

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
                    <label for="target_weight_kg" class="mb-1 block text-sm font-medium">Target weight (kg) <span class="text-[var(--color-charcoal-muted)]">— optional</span></label>
                    <input id="target_weight_kg" name="target_weight_kg" type="number" step="0.1" min="30" max="300" value="{{ old('target_weight_kg', $user->target_weight_kg) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium">Activity level</label>
                    <div class="grid grid-cols-2 gap-2">
                        @foreach (['SEDENTARY' => ['🛋️', 'Sedentary'], 'LIGHT' => ['🚶', 'Light'], 'MODERATE' => ['🏃', 'Moderate'], 'HIGH' => ['🏋️', 'High']] as $value => [$emoji, $label])
                            <label class="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-warm-border)] bg-white py-2.5 text-sm has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                <input type="radio" name="activity_level" value="{{ $value }}" {{ old('activity_level', $user->activity_level) === $value ? 'checked' : '' }} required class="sr-only">
                                {{ $emoji }} {{ $label }}
                            </label>
                        @endforeach
                    </div>
                    @error('activity_level')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium">Ethnicity <span class="text-[var(--color-charcoal-muted)]">— optional</span></label>
                    <div class="chip-group">
                        @foreach ($ethnicityPresets as $preset)
                            <label class="chip {{ $currentEthnicity === $preset ? 'chip-selected' : '' }}">
                                <input type="radio" name="ethnicity_choice" value="{{ $preset }}" {{ $currentEthnicity === $preset ? 'checked' : '' }} class="sr-only"
                                    onclick="document.getElementById('ethnicity-other-field').classList.add('hidden')">
                                {{ $preset }}
                            </label>
                        @endforeach
                        <label class="chip {{ $ethnicityIsOther ? 'chip-selected' : '' }}">
                            <input type="radio" name="ethnicity_choice" value="OTHER" {{ $ethnicityIsOther ? 'checked' : '' }} class="sr-only"
                                onclick="document.getElementById('ethnicity-other-field').classList.remove('hidden'); document.getElementById('ethnicity-other-field').focus()">
                            Other
                        </label>
                    </div>
                    <input id="ethnicity-other-field" type="text" name="ethnicity_other" placeholder="Type your own"
                        value="{{ $ethnicityIsOther ? $currentEthnicity : '' }}"
                        class="{{ $ethnicityIsOther ? '' : 'hidden' }} mt-2 w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
