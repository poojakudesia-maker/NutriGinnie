<x-layouts.app title="Health details · NutriPing">
    <div class="flex flex-col gap-4 pt-6">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Health details</h1>
            <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">This helps the AI build a plan that's safe for you.</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'health') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="medical_conditions" class="mb-1 block text-sm font-medium">Current medication / medical conditions <span class="text-[var(--color-charcoal-muted)]">(optional, comma separated)</span></label>
                    <textarea id="medical_conditions" name="medical_conditions" rows="2" placeholder="e.g. thyroid medication, blood pressure medication"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">{{ old('medical_conditions', is_array($user->medical_conditions) ? implode(', ', $user->medical_conditions) : null) }}</textarea>
                    @error('medical_conditions')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div class="rounded-xl border border-[var(--color-warm-border)] p-3">
                    <label class="flex items-center gap-2 text-sm font-medium">
                        <input type="hidden" name="is_glp1" value="0">
                        <input type="checkbox" name="is_glp1" value="1" onchange="document.getElementById('glp1-fields').classList.toggle('hidden', !this.checked)"
                            {{ old('is_glp1', $user->is_glp1) ? 'checked' : '' }}
                            class="rounded accent-[var(--color-orange)]">
                        I'm currently taking a GLP-1 medication (e.g. Ozempic, Mounjaro, Wegovy)
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
                            <label for="glp1_dosing_day" class="mb-1 block text-sm font-medium">Dosing day</label>
                            <select id="glp1_dosing_day" name="glp1_dosing_day"
                                class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                                <option value="">Select...</option>
                                @foreach (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as $day)
                                    <option value="{{ $day }}" {{ old('glp1_dosing_day', $user->glp1_dosing_day) === $day ? 'selected' : '' }}>{{ ucfirst(strtolower($day)) }}</option>
                                @endforeach
                            </select>
                            @error('glp1_dosing_day')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                        </div>
                    </div>
                </div>

                <x-button type="submit" class="mt-2">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
