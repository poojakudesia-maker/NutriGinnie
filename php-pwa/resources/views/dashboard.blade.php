<x-layouts.app title="Dashboard · NutriPing" :nav="true">
    <div class="flex flex-col gap-5 pt-2">
        <div class="flex items-center justify-between">
            <div>
                <p class="text-xs font-medium text-[var(--color-charcoal-muted)]">Hi {{ explode(' ', auth()->user()->name)[0] }} 👋</p>
                <h1 class="text-xl font-bold text-[var(--color-charcoal)]">NutriPing</h1>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit" aria-label="Sign out" class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-cream-deep)] text-[var(--color-charcoal-muted)]">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                </button>
            </form>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">
                {{ session('status') }}
            </div>
        @endif

        @if (! auth()->user()->hasCompleteProfile())
            <x-card class="flex items-center gap-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-orange-light)] text-xl">👤</div>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-[var(--color-charcoal)]">Finish your profile</p>
                    <p class="text-xs text-[var(--color-charcoal-muted)]">Takes 2 minutes</p>
                </div>
                <x-button href="{{ route('profile.edit', 'basics') }}" class="!w-auto px-4">Start</x-button>
            </x-card>
        @else
            <x-card>
                <div class="flex items-center justify-between">
                    <h2 class="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-charcoal)]">📊 Your numbers</h2>
                    <a href="{{ route('profile.edit', 'basics') }}" class="text-xs font-semibold text-[var(--color-orange-dark)]">Edit</a>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">BMI</p>
                        <p class="text-lg font-bold">{{ auth()->user()->bmi }}</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Body fat (est.)</p>
                        <p class="text-lg font-bold">{{ auth()->user()->body_fat_percent_estimate }}%</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Calorie target</p>
                        <p class="text-lg font-bold">{{ auth()->user()->calorie_target }}</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Deficit</p>
                        <p class="text-lg font-bold">{{ auth()->user()->deficit_kcal }}</p>
                    </div>
                </div>
            </x-card>

            @if (! $hasPlanThisWeek)
                <x-card class="!border-0 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-orange-dark)] text-white">
                    <div class="flex items-center gap-4">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">✨</div>
                        <div class="flex-1">
                            <p class="text-sm font-bold">Your AI diet plan is ready to generate</p>
                            <p class="text-xs text-white/80">Breakfast to dinner, built around your goals</p>
                        </div>
                    </div>
                    <x-button href="{{ route('meal-plan.show') }}" variant="secondary" class="mt-4 !bg-white !text-[var(--color-orange-dark)]">Generate my plan</x-button>
                </x-card>
            @else
                <x-card class="flex items-center gap-4">
                    <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-sage-light)] text-xl">✅</div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-[var(--color-charcoal)]">This week's plan is ready</p>
                        <p class="text-xs text-[var(--color-charcoal-muted)]">Delivered nightly on WhatsApp</p>
                    </div>
                    <x-button href="{{ route('meal-plan.show') }}" variant="secondary" class="!w-auto px-4">View</x-button>
                </x-card>
            @endif

            <x-button href="{{ route('recipes.index') }}" variant="ghost" class="justify-start gap-2 !px-0">
                📝 My Recipes <span class="text-[var(--color-charcoal-muted)]">— add your favourites</span>
            </x-button>
        @endif
    </div>
</x-layouts.app>
