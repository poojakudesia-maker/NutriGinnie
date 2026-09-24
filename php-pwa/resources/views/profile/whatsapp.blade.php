@php
    $numbers = is_array($user->whatsapp_numbers) && count($user->whatsapp_numbers)
        ? $user->whatsapp_numbers
        : array_filter([$user->mobile_number]);
    $numbers = array_pad(array_values($numbers), 2, '');
@endphp
<x-layouts.app title="WhatsApp numbers · NutriPing" :nav="true">
    <div class="flex flex-col gap-4 pt-2">
        <div>
            <h1 class="text-xl font-bold text-[var(--color-charcoal)]">📱 WhatsApp numbers</h1>
            <p class="mt-0.5 text-xs text-[var(--color-charcoal-muted)]">Where your daily plan gets sent — up to 2 numbers</p>
        </div>

        <x-card>
            <form method="POST" action="{{ route('profile.whatsapp.update') }}" class="flex flex-col gap-4">
                @csrf

                <div>
                    <label for="mobile_number" class="mb-1 block text-sm font-medium">Your mobile number</label>
                    <input id="mobile_number" name="mobile_number" type="tel" required
                        value="{{ old('mobile_number', $user->mobile_number) }}"
                        class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    @error('mobile_number')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="mb-1 block text-sm font-medium">Send the daily plan to</label>
                    <div class="flex flex-col gap-2">
                        <input name="whatsapp_numbers[]" type="tel" placeholder="+91XXXXXXXXXX"
                            value="{{ old('whatsapp_numbers.0', $numbers[0]) }}"
                            class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                        <input name="whatsapp_numbers[]" type="tel" placeholder="+91XXXXXXXXXX (optional second number)"
                            value="{{ old('whatsapp_numbers.1', $numbers[1]) }}"
                            class="w-full rounded-xl border border-[var(--color-warm-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--color-orange)] focus:outline-none focus:ring-2 focus:ring-[var(--color-orange-light)]">
                    </div>
                    @error('whatsapp_numbers')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    @error('whatsapp_numbers.0')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    @error('whatsapp_numbers.1')<p class="mt-1 text-xs text-red-600">{{ $message }}</p>@enderror
                    <p class="mt-1 text-xs text-[var(--color-charcoal-muted)]">Leave the second blank if you only want one number.</p>
                </div>

                <x-button type="submit">Save</x-button>
            </form>
        </x-card>
    </div>
</x-layouts.app>
