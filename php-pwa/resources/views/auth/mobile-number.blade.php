<x-layouts.app title="Add your number · NutriPing">
    <div class="flex flex-col gap-6 pt-6">
        <div class="text-center">
            <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-orange-light)] text-2xl">
                📱
            </div>
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">One more thing</h1>
            <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">Add your WhatsApp number so we can send your daily plan.</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('onboarding.mobile.store') }}" class="flex flex-col gap-4">
                @csrf
                <div>
                    <label for="mobile_number" class="mb-1 block text-sm font-medium">Mobile number</label>
                    <input id="mobile_number" name="mobile_number" type="tel" required autofocus
                        placeholder="+91XXXXXXXXXX" value="{{ old('mobile_number') }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('mobile_number')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>
                <x-button type="submit">Continue</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
