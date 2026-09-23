<x-layouts.app title="Dashboard · NutriPing">
    <div class="flex flex-col gap-6 pt-6">
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Hi {{ auth()->user()->name }} 👋</h1>
                <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">Your account is verified.</p>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit" class="text-sm font-semibold text-[var(--color-orange-dark)]">Sign out</button>
            </form>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">
                {{ session('status') }}
            </div>
        @endif

        @if (! auth()->user()->hasCompleteProfile())
            <x-card>
                <p class="text-sm text-[var(--color-charcoal-muted)]">
                    Let's finish setting up your profile so we can build your personalised diet plan.
                </p>
                <x-button href="{{ route('profile.edit', 'basics') }}" class="mt-3">Complete your profile</x-button>
            </x-card>
        @else
            <x-card>
                <div class="flex items-center justify-between">
                    <h2 class="text-sm font-semibold text-[var(--color-charcoal)]">Your profile</h2>
                    <a href="{{ route('profile.edit', 'basics') }}" class="text-xs font-semibold text-[var(--color-orange-dark)]">Edit</a>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">BMI</p>
                        <p class="text-lg font-bold">{{ auth()->user()->bmi }}</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Est. body fat</p>
                        <p class="text-lg font-bold">{{ auth()->user()->body_fat_percent_estimate }}%</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Daily calorie target</p>
                        <p class="text-lg font-bold">{{ auth()->user()->calorie_target }} kcal</p>
                    </div>
                    <div>
                        <p class="text-[var(--color-charcoal-muted)]">Daily deficit</p>
                        <p class="text-lg font-bold">{{ auth()->user()->deficit_kcal }} kcal</p>
                    </div>
                </div>
            </x-card>

            <div class="grid grid-cols-2 gap-3">
                <x-button href="{{ route('recipes.index') }}" variant="secondary">Your recipes</x-button>
                <x-button href="{{ route('meal-plan.show') }}" variant="secondary">Weekly plan</x-button>
            </div>
        @endif
    </div>
</x-layouts.app>
