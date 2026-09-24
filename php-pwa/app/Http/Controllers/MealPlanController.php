<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateWeeklyPlan;
use App\Services\WhatsApp\WhatsAppDispatcher;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class MealPlanController extends Controller
{
    public function show(Request $request): View
    {
        $user = $request->user();
        $weekStart = Carbon::now($user->timezone ?: 'Asia/Kolkata')->startOfWeek(Carbon::MONDAY);

        $days = $user->mealPlans()
            ->where('week_start_date', $weekStart->toDateString())
            ->orderBy('day_index')
            ->get();

        $groceries = $user->groceries()
            ->whereBetween('for_date', [$weekStart->toDateString(), $weekStart->copy()->addDays(6)->toDateString()])
            ->get();

        return view('meal-plan.show', [
            'weekStart' => $weekStart,
            'days' => $days,
            'generating' => $user->plan_generating,
            'generationError' => $user->plan_generation_error,
            'groceryByCategory' => $this->aggregateGroceries($groceries),
        ]);
    }

    /** Merges the week's daily grocery lists into one, combining matching name+unit entries. */
    protected function aggregateGroceries($groceries): array
    {
        $merged = [];

        foreach ($groceries as $day) {
            foreach (($day->items ?? []) as $item) {
                $name = trim((string) ($item['name'] ?? ''));
                if ($name === '') {
                    continue;
                }
                $unit = trim((string) ($item['unit'] ?? ''));
                $category = trim((string) ($item['category'] ?? 'Other')) ?: 'Other';
                $key = mb_strtolower($name) . '|' . mb_strtolower($unit);

                $quantity = $item['quantity'] ?? null;

                if (! isset($merged[$key])) {
                    $merged[$key] = ['name' => $name, 'unit' => $unit, 'category' => $category, 'quantity' => is_numeric($quantity) ? (float) $quantity : null, 'quantities' => is_numeric($quantity) ? [] : [(string) $quantity]];
                    continue;
                }

                if (is_numeric($quantity) && $merged[$key]['quantity'] !== null) {
                    $merged[$key]['quantity'] += (float) $quantity;
                } elseif (! is_numeric($quantity)) {
                    $merged[$key]['quantities'][] = (string) $quantity;
                }
            }
        }

        $byCategory = [];
        foreach ($merged as $item) {
            $qty = $item['quantity'] !== null
                ? (fmod($item['quantity'], 1) === 0.0 ? (string) (int) $item['quantity'] : (string) $item['quantity'])
                : implode('+', array_filter($item['quantities']));

            $byCategory[$item['category']][] = trim($item['name'] . ' — ' . $qty . $item['unit'], ' —');
        }

        ksort($byCategory);

        return $byCategory;
    }

    public function generate(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasCompleteProfile()) {
            return redirect()->route('profile.edit', 'basics')->withErrors(['profile' => 'Please finish your profile first.']);
        }

        if ($user->plan_generating) {
            return redirect()->route('meal-plan.show');
        }

        $user->forceFill(['plan_generating' => true, 'plan_generation_error' => null])->save();

        // afterResponse(): the user gets redirected immediately instead of the
        // request hanging until Claude replies (30-90s), which on shared
        // hosting exceeds the front-end proxy's timeout and 504s.
        GenerateWeeklyPlan::dispatch($user)->afterResponse();

        return redirect()->route('meal-plan.show')->with('status', 'Generating your plan — this can take up to a minute…');
    }

    /** Sends tomorrow's plan — matches the nightly scheduler's semantics (sent the evening before). */
    public function sendNow(Request $request, WhatsAppDispatcher $dispatcher): RedirectResponse
    {
        $user = $request->user();
        $tomorrow = Carbon::now($user->timezone ?: 'Asia/Kolkata')->addDay();
        $weekStart = $tomorrow->copy()->startOfWeek(Carbon::MONDAY);
        // diffInDays returns a float when either side carries a time-of-day component
        // (e.g. 4.48), which never matches the integer day_index column — round it down
        // to a whole day count first.
        $dayIndex = (int) $weekStart->startOfDay()->diffInDays($tomorrow->copy()->startOfDay());

        $day = $user->mealPlans()
            ->where('week_start_date', $weekStart->toDateString())
            ->where('day_index', $dayIndex)
            ->first();

        if (! $day) {
            return redirect()->route('meal-plan.show')->withErrors(['plan' => "No plan for {$tomorrow->format('l')} yet — generate this week's plan first."]);
        }

        $result = $dispatcher->sendDayPlan($user, $day);

        if ($result['sent'] === 0) {
            return redirect()->route('meal-plan.show')->withErrors(['plan' => 'Could not send to WhatsApp: ' . implode(' ', $result['errors'])]);
        }

        if ($result['failed'] > 0) {
            return redirect()->route('meal-plan.show')->with('status', "Sent to {$result['sent']} number(s), but failed for {$result['failed']}: " . implode(' ', $result['errors']));
        }

        return redirect()->route('meal-plan.show')->with('status', "{$tomorrow->format('l')}'s plan was sent to WhatsApp!");
    }

    public function downloadPdf(Request $request): Response
    {
        $user = $request->user();
        $weekStart = Carbon::now($user->timezone ?: 'Asia/Kolkata')->startOfWeek(Carbon::MONDAY);

        $days = $user->mealPlans()
            ->where('week_start_date', $weekStart->toDateString())
            ->orderBy('day_index')
            ->get();

        abort_if($days->isEmpty(), 404, 'No plan generated for this week yet.');

        $pdf = Pdf::loadView('meal-plan.pdf', [
            'user' => $user,
            'weekStart' => $weekStart,
            'days' => $days,
        ])->setPaper('a4');

        return $pdf->download('nutriping-weekly-plan-' . $weekStart->toDateString() . '.pdf');
    }
}
