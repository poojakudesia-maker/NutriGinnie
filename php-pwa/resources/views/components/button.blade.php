@props(['variant' => 'primary', 'type' => 'submit', 'class' => '', 'href' => null])

@php
$variants = [
    'primary' => 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-orange-dark)] text-white shadow-[0_8px_20px_-6px_rgba(244,112,58,0.55)] hover:brightness-105 disabled:opacity-50',
    'secondary' => 'bg-[var(--color-cream-deep)] text-[var(--color-charcoal)] hover:bg-[var(--color-warm-border)]',
    'ghost' => 'bg-transparent text-[var(--color-orange-dark)] hover:bg-[var(--color-orange-light)]',
];
@endphp

@if ($href)
    <a href="{{ $href }}" {{ $attributes->merge(['class' => "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all {$variants[$variant]} $class"]) }}>
        {{ $slot }}
    </a>
@else
    <button type="{{ $type }}" {{ $attributes->merge(['class' => "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed {$variants[$variant]} $class"]) }}>
        {{ $slot }}
    </button>
@endif
