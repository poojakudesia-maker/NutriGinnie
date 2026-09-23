@props(['stepIndex', 'totalSteps'])

<div class="mb-2 flex items-center gap-1.5">
    @for ($i = 0; $i < $totalSteps; $i++)
        <div class="h-1.5 flex-1 rounded-full {{ $i <= $stepIndex ? 'bg-[var(--color-orange)]' : 'bg-[var(--color-warm-border)]' }}"></div>
    @endfor
</div>
<p class="mb-4 text-xs font-medium text-[var(--color-charcoal-muted)]">Step {{ $stepIndex + 1 }} of {{ $totalSteps }}</p>
