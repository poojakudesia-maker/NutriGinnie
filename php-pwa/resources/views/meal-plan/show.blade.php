<x-layouts.app title="Weekly plan · NutriPing">
    <div class="flex flex-col gap-4 pt-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">This week's plan</h1>
                <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">Week of {{ $weekStart->format('M j') }} - {{ $weekStart->copy()->addDays(6)->format('M j') }}</p>
            </div>
            <x-button href="{{ route('dashboard') }}" variant="ghost" class="!w-auto px-3">Back</x-button>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">{{ session('status') }}</div>
        @endif
        @error('plan')<div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ $message }}</div>@enderror

        <div class="flex gap-2">
            <form method="POST" action="{{ route('meal-plan.generate') }}" class="flex-1">
                @csrf
                <x-button type="submit">{{ $days->isEmpty() ? 'Generate my plan' : 'Regenerate plan' }}</x-button>
            </form>
            @if ($days->isNotEmpty())
                <x-button href="{{ route('meal-plan.pdf') }}" variant="secondary" class="!w-auto px-4">Download PDF</x-button>
            @endif
        </div>

        @if ($days->isNotEmpty())
            <form method="POST" action="{{ route('meal-plan.send-now') }}">
                @csrf
                <x-button type="submit" variant="ghost">Send today's plan to WhatsApp now</x-button>
            </form>
        @endif

        @if ($days->isEmpty())
            <x-card>
                <p class="text-sm text-[var(--color-charcoal-muted)]">
                    No plan yet. We'll combine your saved recipes, any dietitian plan you uploaded, and AI to build a full week of breakfast, snacks, lunch, and dinner — with calories for every item.
                </p>
            </x-card>
        @else
            @foreach ($days as $day)
                <x-card>
                    <div class="mb-2 flex items-center justify-between">
                        <h2 class="font-semibold text-[var(--color-charcoal)]">{{ $day->day_label }}</h2>
                        <span class="text-xs text-[var(--color-charcoal-muted)]">{{ round($day->total_calories) }} kcal</span>
                    </div>
                    <div class="flex flex-col divide-y divide-[var(--color-warm-border)]">
                        @foreach (['breakfast' => 'Breakfast', 'snack1' => 'Morning snack', 'lunch' => 'Lunch', 'snack2' => 'Evening snack', 'dinner' => 'Dinner'] as $slot => $label)
                            @php $meal = $day->meals[$slot] ?? null; @endphp
                            @if ($meal)
                                <div class="flex items-center justify-between gap-2 py-2 text-sm">
                                    <div class="min-w-0">
                                        <p class="text-xs font-semibold uppercase tracking-wide text-[var(--color-sage)]">{{ $label }}</p>
                                        <p class="truncate text-[var(--color-charcoal)]">{{ $meal['name'] }}</p>
                                    </div>
                                    <span class="shrink-0 text-xs text-[var(--color-charcoal-muted)]">{{ round($meal['calories']) }} kcal</span>
                                </div>
                            @endif
                        @endforeach
                    </div>
                </x-card>
            @endforeach
        @endif

        <div class="flex gap-2">
            <x-button href="{{ route('recipes.index') }}" variant="secondary">Manage recipes</x-button>
        </div>
    </div>
</x-layouts.app>
