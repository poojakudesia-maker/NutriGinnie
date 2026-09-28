<x-layouts.app title="Profile picture · NutriPing">
    <div class="flex flex-col gap-4 pt-2">
        <x-profile.progress :step-index="$stepIndex" :total-steps="$totalSteps" />

        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">📷 Add a photo</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">Totally optional — you can skip this</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.update', 'photo') }}" enctype="multipart/form-data" class="flex flex-col gap-4">
                @csrf
                @if ($editMode ?? false)<input type="hidden" name="edit" value="1">@endif

                <div class="flex items-center gap-4">
                    @if ($user->profile_photo_path)
                        <img src="{{ Storage::disk('public')->url($user->profile_photo_path) }}" alt="Profile photo" class="h-16 w-16 rounded-full object-cover">
                    @else
                        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-orange-light)] text-lg font-semibold text-[var(--color-orange-dark)]">
                            {{ strtoupper(substr($user->name, 0, 1)) }}
                        </div>
                    @endif

                    <input id="profile_photo" name="profile_photo" type="file" accept="image/*"
                        class="flex-1 rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-orange-light)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-orange-dark)]">
                </div>
                @error('profile_photo')<p class="text-xs text-red-600">{{ $message }}</p>@enderror

                <x-button type="submit" class="mt-2">Finish setup</x-button>
            </form>
        </x-card>

        @php $results = \App\Services\NutritionCalculator::calculate($user); @endphp
        @if ($results)
            <x-card class="!bg-[var(--color-sage-light)]">
                <h2 class="mb-3 text-sm font-semibold text-[var(--color-charcoal)]">Your numbers, based on what you've entered</h2>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">BMI</p>
                        <p class="text-lg font-bold">{{ $results['bmi'] }}</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Est. body fat</p>
                        <p class="text-lg font-bold">{{ $results['body_fat_percent_estimate'] }}%</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Daily calorie target</p>
                        <p class="text-lg font-bold">{{ $results['calorie_target'] }} kcal</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Daily deficit</p>
                        <p class="text-lg font-bold">{{ $results['deficit_kcal'] }} kcal</p>
                    </div>
                </div>
                <p class="mt-3 text-xs leading-relaxed text-[var(--color-charcoal-muted)]">{{ $results['workout_recommendation'] }}</p>
                <p class="mt-2 text-[10px] text-[var(--color-charcoal-muted)]">Body fat % is a rough formula-based estimate, not a measurement. Consult a professional for precise body composition analysis.</p>
            </x-card>
        @endif
    </div>
</x-layouts.app>
