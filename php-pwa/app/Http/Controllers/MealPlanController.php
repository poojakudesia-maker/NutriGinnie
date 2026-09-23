<?php

namespace App\Http\Controllers;

use App\Services\DietPlanGenerator;
use App\Services\WhatsApp\WhatsAppDispatcher;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;
use Throwable;

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

        return view('meal-plan.show', [
            'weekStart' => $weekStart,
            'days' => $days,
        ]);
    }

    public function generate(Request $request, DietPlanGenerator $generator): RedirectResponse
    {
        $user = $request->user();

        if (! $user->hasCompleteProfile()) {
            return redirect()->route('profile.edit', 'basics')->withErrors(['profile' => 'Please finish your profile first.']);
        }

        try {
            $generator->generateWeek($user);
        } catch (Throwable $e) {
            return redirect()->route('meal-plan.show')->withErrors(['plan' => $e->getMessage()]);
        }

        return redirect()->route('meal-plan.show')->with('status', 'Your weekly plan is ready!');
    }

    public function sendNow(Request $request, WhatsAppDispatcher $dispatcher): RedirectResponse
    {
        $user = $request->user();
        $today = Carbon::now($user->timezone ?: 'Asia/Kolkata');
        $weekStart = $today->copy()->startOfWeek(Carbon::MONDAY);
        $dayIndex = $weekStart->diffInDays($today);

        $day = $user->mealPlans()
            ->where('week_start_date', $weekStart->toDateString())
            ->where('day_index', $dayIndex)
            ->first();

        if (! $day) {
            return redirect()->route('meal-plan.show')->withErrors(['plan' => "No plan for today yet — generate this week's plan first."]);
        }

        try {
            $dispatcher->sendDayPlan($user, $day);
        } catch (Throwable $e) {
            return redirect()->route('meal-plan.show')->withErrors(['plan' => 'Could not send to WhatsApp: ' . $e->getMessage()]);
        }

        return redirect()->route('meal-plan.show')->with('status', "Today's plan was sent to WhatsApp!");
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
