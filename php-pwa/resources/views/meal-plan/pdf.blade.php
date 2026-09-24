<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #2b2620; font-size: 11px; }
        h1 { color: #d9581f; font-size: 20px; margin-bottom: 2px; }
        .subtitle { color: #6b6255; font-size: 11px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        th { background: #fde3d3; color: #d9581f; text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #ece1d3; vertical-align: top; }
        .day-title { background: #f3e9da; padding: 6px 8px; font-weight: bold; font-size: 13px; }
        .totals { color: #6b6255; font-size: 10px; }
        .kcal { color: #7c9a79; font-weight: bold; white-space: nowrap; }
    </style>
</head>
<body>
    <h1>NutriPing Weekly Plan</h1>
    <p class="subtitle">{{ $user->name }} &middot; Week of {{ $weekStart->format('M j') }} - {{ $weekStart->copy()->addDays(6)->format('M j, Y') }}</p>

    @foreach ($days as $day)
        <table>
            <tr>
                <td colspan="2" class="day-title">
                    {{ $day->day_label }}
                    <span class="totals">— {{ round($day->total_calories) }} kcal &middot; {{ round($day->total_protein_g) }}g protein &middot; {{ round($day->total_carbs_g) }}g carbs &middot; {{ round($day->total_fat_g) }}g fat</span>
                </td>
            </tr>
            <tr>
                <th style="width: 25%;">Meal</th>
                <th>Item</th>
            </tr>
            @foreach (['breakfast' => 'Breakfast', 'snack1' => 'Morning snack', 'lunch' => 'Lunch', 'snack2' => 'Evening snack', 'dinner' => 'Dinner'] as $slot => $label)
                @php $meal = $day->meals[$slot] ?? null; @endphp
                @if ($meal)
                    <tr>
                        <td><strong>{{ $label }}</strong></td>
                        <td>
                            {{ $meal['name'] }}
                            <span class="kcal"> — {{ round($meal['calories']) }} kcal</span>
                        </td>
                    </tr>
                @endif
            @endforeach
        </table>
    @endforeach
</body>
</html>
