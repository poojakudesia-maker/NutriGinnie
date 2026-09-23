<x-layouts.app title="Verify email · NutriPing">
    <div class="flex flex-col gap-6 pt-6">
        <div>
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Check your email</h1>
            <p class="mt-1 text-sm text-[var(--color-charcoal-muted)]">We've sent a 6-digit activation code to your email address. Enter it below to verify your account.</p>
        </div>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">
                {{ session('status') }}
            </div>
        @endif

        <x-card>
            <form method="POST" action="{{ route('verify-code.store') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="code" class="mb-1 block text-sm font-medium">Activation code</label>
                    <input id="code" name="code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" required autofocus
                        placeholder="000000"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('code')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    @error('email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <x-button type="submit">Verify &amp; continue</x-button>
            </form>
        </x-card>

        <form method="POST" action="{{ route('verify-code.resend') }}" class="text-center">
            @csrf
            <button type="submit" class="text-sm font-semibold text-[var(--color-orange-dark)]">Resend code</button>
        </form>
    </div>
</x-layouts.app>
