<x-layouts.app title="Create account · NutriPing">
    <div class="flex flex-col gap-5 pt-8">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Create your account</h1>
        </div>

        <x-google-button />

        <div class="flex items-center gap-2 text-xs text-[var(--color-charcoal-muted)]">
            <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
            or
            <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
        </div>

        <x-card>
            <form method="POST" action="{{ route('register.store') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="name" class="mb-1 block text-sm font-medium">Full name</label>
                    <input id="name" name="name" type="text" value="{{ old('name') }}" required autofocus
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('name')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="email" class="mb-1 block text-sm font-medium">Email address</label>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="mobile_number" class="mb-1 block text-sm font-medium">Mobile number</label>
                    <input id="mobile_number" name="mobile_number" type="tel" value="{{ old('mobile_number') }}" required
                        placeholder="+91XXXXXXXXXX"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">Your weekly diet plan will be sent here via WhatsApp.</p>
                    @error('mobile_number')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="password" class="mb-1 block text-sm font-medium">Password</label>
                    <input id="password" name="password" type="password" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('password')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="password_confirmation" class="mb-1 block text-sm font-medium">Confirm password</label>
                    <input id="password_confirmation" name="password_confirmation" type="password" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                </div>

                <x-button type="submit" class="mt-2">Send activation code</x-button>
            </form>
        </x-card>

        <p class="text-center text-sm text-[var(--color-charcoal-muted)]">
            Already have an account?
            <a href="{{ route('login.create') }}" class="font-semibold text-[var(--color-orange-dark)]">Sign in</a>
        </p>
    </div>
</x-layouts.app>
