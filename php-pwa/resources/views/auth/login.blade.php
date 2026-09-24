<x-layouts.app title="Sign in · NutriPing">
    <div class="flex flex-col gap-5 pt-8">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-[var(--color-charcoal)]">Welcome back</h1>
        </div>

        <x-google-button />

        <div class="flex items-center gap-2 text-xs text-[var(--color-charcoal-muted)]">
            <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
            or
            <div class="h-px flex-1 bg-[var(--color-warm-border)]"></div>
        </div>

        <x-card>
            <form method="POST" action="{{ route('login.store') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="email" class="mb-1 block text-sm font-medium">Email address</label>
                    <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('email')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label for="password" class="mb-1 block text-sm font-medium">Password</label>
                    <input id="password" name="password" type="password" required
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('password')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <label class="flex items-center gap-2 text-sm text-[var(--color-charcoal-muted)]">
                    <input type="checkbox" name="remember" class="rounded border-[var(--color-warm-border)]">
                    Remember me
                </label>

                <x-button type="submit">Sign in</x-button>
            </form>
        </x-card>

        <p class="text-center text-sm text-[var(--color-charcoal-muted)]">
            New here?
            <a href="{{ route('register.create') }}" class="font-semibold text-[var(--color-orange-dark)]">Create an account</a>
        </p>
    </div>
</x-layouts.app>
