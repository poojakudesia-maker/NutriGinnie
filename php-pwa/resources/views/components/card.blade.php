@props(['class' => ''])

<div {{ $attributes->merge(['class' => "rounded-3xl border border-[var(--color-warm-border)] bg-[var(--color-surface)] p-4 shadow-[0_4px_20px_-4px_rgba(43,38,32,0.08)] $class"]) }}>
    {{ $slot }}
</div>
