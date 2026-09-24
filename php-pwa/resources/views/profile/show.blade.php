@php
    $rows = [
        ['step' => 'basics', 'emoji' => '📏', 'label' => 'Basics', 'detail' => $user->age ? "{$user->age}y · {$user->height_cm}cm · {$user->weight_kg}kg" : 'Not set'],
        ['step' => 'health', 'emoji' => '💊', 'label' => 'Health', 'detail' => $user->is_glp1 ? 'On GLP-1' : (is_array($user->medical_conditions) && count($user->medical_conditions) ? implode(', ', $user->medical_conditions) : 'None on file')],
        ['step' => 'diet', 'emoji' => '🍽️', 'label' => 'Food preferences', 'detail' => $user->diet_type ? ucfirst(strtolower(str_replace('_', ' ', $user->diet_type))) : 'Not set'],
        ['step' => 'dietitian', 'emoji' => '🩺', 'label' => 'Dietitian plan', 'detail' => $user->has_dietitian ? 'On file' : 'None'],
        ['step' => 'photo', 'emoji' => '📷', 'label' => 'Photo', 'detail' => $user->profile_photo_path ? 'Added' : 'Not set'],
    ];
@endphp
<x-layouts.app title="Profile · NutriPing" :nav="true">
    <div class="flex flex-col gap-4 pt-2">
        <div class="flex items-center gap-3">
            @if ($user->profile_photo_path)
                <img src="{{ Storage::disk('public')->url($user->profile_photo_path) }}" alt="" class="h-12 w-12 rounded-full object-cover">
            @else
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-orange-light)] text-lg font-semibold text-[var(--color-orange-dark)]">
                    {{ strtoupper(substr($user->name, 0, 1)) }}
                </div>
            @endif
            <div>
                <h1 class="text-lg font-bold text-[var(--color-charcoal)]">{{ $user->name }}</h1>
                <p class="text-xs text-[var(--color-charcoal-muted)]">{{ $user->email }}</p>
            </div>
        </div>
        <p class="text-[11px] text-[var(--color-charcoal-muted)]">Name and email can't be changed here.</p>

        @if (session('status'))
            <div class="rounded-xl bg-[var(--color-sage-light)] px-4 py-3 text-sm text-[var(--color-charcoal)]">{{ session('status') }}</div>
        @endif

        <x-card class="flex items-center justify-between gap-3">
            <div class="min-w-0">
                <p class="text-sm font-semibold text-[var(--color-charcoal)]">📱 WhatsApp numbers</p>
                <p class="truncate text-xs text-[var(--color-charcoal-muted)]">
                    {{ $user->mobile_number ?: 'Not set' }}
                    @if (is_array($user->whatsapp_numbers) && count($user->whatsapp_numbers) > 1)
                        + {{ count($user->whatsapp_numbers) - 1 }} more
                    @endif
                </p>
            </div>
            <a href="{{ route('profile.whatsapp.edit') }}" class="shrink-0 text-xs font-semibold text-[var(--color-orange-dark)]">Edit</a>
        </x-card>

        @foreach ($rows as $row)
            <x-card class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--color-charcoal)]">{{ $row['emoji'] }} {{ $row['label'] }}</p>
                    <p class="truncate text-xs text-[var(--color-charcoal-muted)]">{{ $row['detail'] }}</p>
                </div>
                <a href="{{ route('profile.edit', $row['step']) }}?edit=1" class="shrink-0 text-xs font-semibold text-[var(--color-orange-dark)]">Edit</a>
            </x-card>
        @endforeach

        <form method="POST" action="{{ route('logout') }}" class="mt-2">
            @csrf
            <x-button type="submit" variant="ghost">Sign out</x-button>
        </form>
    </div>
</x-layouts.app>
