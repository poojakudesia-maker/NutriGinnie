@php
    $slots = [
        'breakfast' => ['🥣', 'Breakfast'],
        'snack1' => ['🍎', 'Morning snack'],
        'lunch' => ['🍛', 'Lunch'],
        'snack2' => ['🥤', 'Evening snack'],
        'dinner' => ['🍲', 'Dinner'],
    ];
    $byCategory = $groceryItems->groupBy(fn ($item) => $item['category'] ?? 'Other');
@endphp
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, Helvetica, Arial, sans-serif; background: #fdf8f2; padding: 24px 12px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto;">

        <div style="background: #ffffff; border-radius: 24px; padding: 28px; border: 1px solid #ece1d3; margin-bottom: 16px;">
            <p style="color: #6b6255; font-size: 12px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.05em;">NutriPing</p>
            <h1 style="color: #2b2620; font-size: 20px; margin: 0 0 4px;">Hi {{ $user->name }}! 🌙</h1>
            <p style="color: #6b6255; font-size: 14px; margin: 0;">Here's your plan for <strong>{{ $forDate->format('l, M j') }}</strong></p>
        </div>

        <div style="background: #ffffff; border-radius: 24px; padding: 24px 28px; border: 1px solid #ece1d3; margin-bottom: 16px;">
            @foreach ($slots as $slot => [$emoji, $label])
                @php $meal = $day->meals[$slot] ?? null; @endphp
                @if ($meal)
                    <div style="padding: 12px 0; border-bottom: 1px solid #ece1d3;">
                        <p style="color: #7c9a79; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px;">{{ $emoji }} {{ $label }}</p>
                        <table width="100%" style="border-collapse: collapse;"><tr>
                            <td style="color: #2b2620; font-size: 14px;">{{ $meal['name'] }}</td>
                            <td align="right" style="color: #6b6255; font-size: 12px; white-space: nowrap;">{{ round($meal['calories']) }} kcal</td>
                        </tr></table>
                    </div>
                @endif
            @endforeach

            <div style="background: #fde3d3; border-radius: 12px; padding: 12px 16px; margin-top: 16px; text-align: center;">
                <span style="color: #d9581f; font-size: 13px; font-weight: 700;">
                    {{ round($day->total_calories) }} kcal total
                </span>
                <span style="color: #d9581f; font-size: 12px;">
                    &middot; {{ round($day->total_protein_g) }}g protein &middot; {{ round($day->total_carbs_g) }}g carbs &middot; {{ round($day->total_fat_g) }}g fat
                </span>
            </div>
        </div>

        @if ($byCategory->isNotEmpty())
            <div style="background: #e3ecdf; border-radius: 24px; padding: 24px 28px; margin-bottom: 16px;">
                <p style="color: #2b2620; font-size: 14px; font-weight: 700; margin: 0 0 12px;">🛒 Grocery list for today</p>
                @foreach ($byCategory as $category => $items)
                    <p style="color: #7c9a79; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 12px 0 4px;">{{ ucfirst(strtolower($category)) }}</p>
                    @foreach ($items as $item)
                        <p style="color: #2b2620; font-size: 13px; margin: 0 0 2px;">• {{ $item['name'] ?? '' }} — {{ $item['quantity'] ?? '' }}{{ $item['unit'] ?? '' }}</p>
                    @endforeach
                @endforeach
            </div>
        @endif

        <div style="background: #ffffff; border-radius: 24px; padding: 24px 28px; border: 1px solid #ece1d3; margin-bottom: 16px;">
            <p style="color: #2b2620; font-size: 14px; font-weight: 700; margin: 0 0 6px;">💬 Want this on WhatsApp?</p>
            <p style="color: #6b6255; font-size: 12px; margin: 0 0 12px;">Tap and hold the text below to select it, copy, then paste it into any WhatsApp chat.</p>
            <div style="background: #fdf8f2; border: 1px dashed #ece1d3; border-radius: 12px; padding: 14px; font-family: 'Courier New', monospace; font-size: 12px; color: #2b2620; white-space: pre-wrap; line-height: 1.6;">{{ $copyableText }}</div>
        </div>

        <p style="text-align: center; margin: 0;">
            <a href="{{ config('app.url') }}/meal-plan" style="color: #d9581f; font-size: 13px; font-weight: 600; text-decoration: none;">View your full week on NutriPing &rarr;</a>
        </p>

    </div>
</body>
</html>
