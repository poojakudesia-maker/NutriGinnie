<x-layouts.app title="Delivery emails · NutriPing" :nav="true">
    <div class="flex flex-col gap-4 pt-2">
        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">📧 Delivery emails</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">Where your daily plan gets emailed — your account email plus one optional extra</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.delivery-emails.update') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label class="mb-1 block text-sm font-medium">Your account email</label>
                    <input type="email" disabled value="{{ $user->email }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-[var(--color-cream)] px-3 py-2.5 text-sm text-[var(--color-charcoal-muted)]">
                    <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">Always receives the daily plan. Can't be changed here.</p>
                </div>

                <div>
                    <label for="secondary_email" class="mb-1 block text-sm font-medium">Additional email (optional)</label>
                    <input id="secondary_email" name="secondary_email" type="email" placeholder="someone-else@example.com"
                        value="{{ old('secondary_email', $user->secondary_email) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('secondary_email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">Leave blank to only send to your account email.</p>
                </div>

                <x-button type="submit">Save</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
