@php
    $conditionPresets = ['Thyroid', 'Blood pressure', 'Diabetes', 'PCOS / PCOD', 'Heart condition', 'Cholesterol'];
    $currentConditions = is_array($user->medical_conditions) ? implode(', ', $user->medical_conditions) : '';
@endphp
<x-layouts.app title="Health details · NutriPing">
    <div class="flex flex-col gap-4 pt-2">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">💊 Health details</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">So the AI builds a plan that's safe for you</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'health') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label class="mb-2 block text-sm font-medium">Current medication / conditions <span class="text-[var(--color-charcoal-muted)]">— optional</span></label>
                    <div class="chip-group" data-for="medical_conditions">
                        @foreach ($conditionPresets as $preset)
                            <button type="button" class="chip" data-value="{{ $preset }}">{{ $preset }}</button>
                        @endforeach
                    </div>
                    <input type="hidden" id="medical_conditions" name="medical_conditions" value="{{ old('medical_conditions', $currentConditions) }}">
                    <div data-chip-add-for="medical_conditions" class="mt-2 flex gap-2">
                        <input type="text" data-chip-add-input placeholder="Add another…"
                            class="flex-1 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        <button type="button" data-chip-add-button class="rounded-xl bg-[var(--color-cream-deep)] px-3 text-sm font-medium">+ Add</button>
                    </div>
                    @error('medical_conditions')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div class="rounded-xl border border-[var(--color-warm-border)] p-3">
                    <label class="flex items-center gap-2 text-sm font-medium">
                        <input type="hidden" name="is_glp1" value="0">
                        <input type="checkbox" name="is_glp1" value="1" onchange="document.getElementById('glp1-fields').classList.toggle('hidden', !this.checked)"
                            {{ old('is_glp1', $user->is_glp1) ? 'checked' : '' }}
                            class="rounded accent-[var(--color-orange)]">
                        💉 On a GLP-1 medication (Ozempic, Mounjaro, Wegovy…)
                    </label>

                    <div id="glp1-fields" class="{{ old('is_glp1', $user->is_glp1) ? '' : 'hidden' }} mt-3 flex flex-col gap-3">
                        <div>
                            <label for="glp1_medication" class="mb-1 block text-sm font-medium">Which medication?</label>
                            <input id="glp1_medication" name="glp1_medication" type="text" value="{{ old('glp1_medication', $user->glp1_medication) }}"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                            @error('glp1_medication')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                        <div>
                            <label for="glp1_dosage_mg" class="mb-1 block text-sm font-medium">Dose (mg)</label>
                            <input id="glp1_dosage_mg" name="glp1_dosage_mg" type="number" step="0.1" min="0" max="100" value="{{ old('glp1_dosage_mg', $user->glp1_dosage_mg) }}"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                            @error('glp1_dosage_mg')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Dosing day</label>
                            <div class="grid grid-cols-4 gap-1.5">
                                @foreach (['MONDAY' => 'Mon', 'TUESDAY' => 'Tue', 'WEDNESDAY' => 'Wed', 'THURSDAY' => 'Thu', 'FRIDAY' => 'Fri', 'SATURDAY' => 'Sat', 'SUNDAY' => 'Sun'] as $value => $label)
                                    <label class="flex items-center justify-center rounded-lg border border-[var(--color-warm-border)] bg-white py-2 text-xs font-medium has-[:checked]:border-[var(--color-orange)] has-[:checked]:bg-[var(--color-orange-light)]">
                                        <input type="radio" name="glp1_dosing_day" value="{{ $value }}" {{ old('glp1_dosing_day', $user->glp1_dosing_day) === $value ? 'checked' : '' }} class="sr-only">
                                        {{ $label }}
                                    </label>
                                @endforeach
                            </div>
                            @error('glp1_dosing_day')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                    </div>
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
