<x-layouts.app title="Weekly plan · NutriPing" :nav="true">
    <div class="flex flex-col gap-4 pt-2">
        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">🗓️ This week's plan</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">{{ $weekStart->format('M j') }} – {{ $weekStart->copy()->addDays(6)->format('M j') }}</p>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">{{ session('status') }}</div>
        @endif
        @error('plan')<div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ $message }}</div>@enderror
        @if ($generationError && ! $generating)
            <div class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ $generationError }}</div>
        @endif

        @if ($generating)
            <x-card class="flex items-center gap-4">
                <svg class="h-8 w-8 shrink-0 animate-spin text-[var(--color-orange)]" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                <div>
                    <p class="text-sm font-semibold text-[var(--color-charcoal)]">Building your plan…</p>
                    <p class="text-xs text-[var(--color-charcoal-muted)]">Usually takes under a minute. This page will refresh automatically.</p>
                </div>
            </x-card>
            <script>setTimeout(() => window.location.reload(), 5000);</script>
        @else
            <div class="flex gap-2">
                <form method="POST" action="{{ route('meal-plan.generate') }}" class="flex-1">
                    @csrf
                    <x-button type="submit">{{ $days->isEmpty() ? '✨ Generate my plan' : '🔄 Regenerate' }}</x-button>
                </form>
                @if ($days->isNotEmpty())
                    <x-button href="{{ route('meal-plan.pdf') }}" variant="secondary" class="!w-auto px-4" aria-label="Download PDF">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                    </x-button>
                @endif
            </div>

            @if ($days->isNotEmpty())
                <form method="POST" action="{{ route('meal-plan.send-now') }}">
                    @csrf
                    <x-button type="submit" variant="ghost">💬 Send today's plan to WhatsApp</x-button>
                </form>
            @endif

            @if ($days->isEmpty())
                <div class="flex flex-col items-center gap-2 py-10 text-center">
                    <div class="text-4xl">🍱</div>
                    <p class="max-w-[26ch] text-sm text-[var(--color-charcoal-muted)]">Tap "Generate my plan" to build your week — breakfast to dinner, calories included.</p>
                </div>
            @else
                @foreach ($days as $day)
                    <x-card>
                        <div class="mb-2 flex items-center justify-between">
                            <h2 class="font-semibold text-[var(--color-charcoal)]">{{ $day->day_label }}</h2>
                            <span class="rounded-full bg-[var(--color-cream-deep)] px-2 py-0.5 text-xs font-medium text-[var(--color-charcoal-muted)]">{{ round($day->total_calories) }} kcal</span>
                        </div>
                        <div class="flex flex-col divide-y divide-[var(--color-warm-border)]">
                            @foreach (['breakfast' => ['🥣', 'Breakfast'], 'snack1' => ['🍎', 'Morning snack'], 'lunch' => ['🍛', 'Lunch'], 'snack2' => ['🥤', 'Evening snack'], 'dinner' => ['🍲', 'Dinner']] as $slot => [$emoji, $label])
                                @php $meal = $day->meals[$slot] ?? null; @endphp
                                @if ($meal)
                                    <div class="flex items-center gap-2 py-2 text-sm">
                                        <span class="text-base">{{ $emoji }}</span>
                                        <div class="min-w-0 flex-1">
                                            <p class="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-sage)]">{{ $label }}</p>
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
        @endif
    </div>
</x-layouts.app>
