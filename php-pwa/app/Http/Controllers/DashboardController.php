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

        $weekStart = Carbon::now($user->timezone ?: 'Asia/Kolkata')->startOfWeek(Carbon::MONDAY);

        $hasPlanThisWeek = $user->hasCompleteProfile()
            && $user->mealPlans()->where('week_start_date', $weekStart->toDateString())->exists();

        return view('dashboard', [
            'hasPlanThisWeek' => $hasPlanThisWeek,
        ]);
    }
}
