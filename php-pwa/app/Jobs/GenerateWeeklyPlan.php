<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\DietPlanGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

/**
 * Runs the (slow — often 30-90s) AI plan generation. Dispatched with
 * ->afterResponse() so the controller can redirect the user immediately
 * instead of holding the HTTP connection open until Claude replies, which
 * on shared hosting exceeds the front-end proxy's timeout and 504s.
 */
class GenerateWeeklyPlan implements ShouldQueue
{
    use Queueable;

    public int $timeout = 170;

    public function __construct(public User $user)
    {
    }

    public function handle(DietPlanGenerator $generator): void
    {
        if (function_exists('set_time_limit')) {
            @set_time_limit($this->timeout);
        }

        try {
            $generator->generateWeek($this->user->fresh());

            $this->user->forceFill([
                'plan_generating' => false,
                'plan_generation_error' => null,
            ])->save();
        } catch (Throwable $e) {
            $this->user->forceFill([
                'plan_generating' => false,
                'plan_generation_error' => mb_substr($e->getMessage(), 0, 500),
            ])->save();
        }
    }
}
