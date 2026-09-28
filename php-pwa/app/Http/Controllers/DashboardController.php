<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function show(Request $request): View|RedirectResponse
    {
        $user = $request->user();

        if ($user->needsMobileNumber()) {
            return redirect()->route('onboarding.mobile');
        }

        // The "active" week is whichever week contains tomorrow, not today — matches
        // MealPlanController so the CTA doesn't point at an already-elapsed week on Sundays.
        $weekStart = Carbon::now($user->timezone ?: 'Asia/Kolkata')->addDay()->startOfWeek(Carbon::MONDAY);

        $hasPlanThisWeek = $user->hasCompleteProfile()
            && $user->mealPlans()->where('week_start_date', $weekStart->toDateString())->exists();

        return view('dashboard', [
            'hasPlanThisWeek' => $hasPlanThisWeek,
        ]);
    }
}
