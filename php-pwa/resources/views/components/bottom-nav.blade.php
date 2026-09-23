@php
    $current = request()->route()?->getName();
    $items = [
        ['route' => 'dashboard', 'label' => 'Home', 'match' => ['dashboard']],
        ['route' => 'recipes.index', 'label' => 'My Recipes', 'match' => ['recipes.index']],
        ['route' => 'meal-plan.show', 'label' => 'Plan', 'match' => ['meal-plan.show']],
    ];
@endphp

<nav class="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-warm-border)] bg-white/95 backdrop-blur"
     style="padding-bottom: env(safe-area-inset-bottom, 0px);">
    <div class="mx-auto flex max-w-md items-stretch justify-around">
        @foreach ($items as $item)
            @php $active = in_array($current, $item['match'], true); @endphp
            <a href="{{ route($item['route']) }}"
               class="bottom-nav-item flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium {{ $active ? 'text-[var(--color-orange-dark)]' : 'text-[var(--color-charcoal-muted)]' }}">
                @if ($item['route'] === 'dashboard')
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"/></svg>
                @elseif ($item['route'] === 'recipes.index')
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9a2 2 0 0 1 2 2v16l-6.5-3.5L4 21V5a2 2 0 0 1 2-2Z"/><path d="M8 8h6M8 11.5h6"/></svg>
                @else
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3"/><path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/></svg>
                @endif
                {{ $item['label'] }}
            </a>
        @endforeach
    </div>
</nav>
