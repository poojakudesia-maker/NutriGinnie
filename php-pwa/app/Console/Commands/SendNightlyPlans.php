<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DietPlanEmailer;
use App\Services\DietPlanGenerator;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Runs every 15 minutes (see routes/console.php). For each user whose local
 * clock currently matches their chosen dispatch_hour, generates tomorrow's
 * plan if it doesn't exist yet and emails the combined diet + grocery
 * plan — mirroring the "send tonight for tomorrow" cadence.
 */
#[Signature('app:send-nightly-plans')]
#[Description("Email each user their diet + grocery plan for tomorrow, at their chosen local hour.")]
class SendNightlyPlans extends Command
{
    public function handle(DietPlanGenerator $generator, DietPlanEmailer $emailer): int
    {
        $users = User::whereNotNull('email_verified_at')
            ->where('whatsapp_reminders_enabled', true)
            ->get();

        foreach ($users as $user) {
            if (! $user->hasCompleteProfile()) {
                continue;
            }

            $now = Carbon::now($user->timezone ?: 'Asia/Kolkata');
            if ($now->hour !== (int) $user->dispatch_hour) {
                continue;
            }

            if ($this->alreadySentToday($user, $now)) {
                continue;
            }

            $tomorrow = $now->copy()->addDay();
            $weekStart = $tomorrow->copy()->startOfWeek(Carbon::MONDAY);
            // diffInDays returns a float when either side carries a time-of-day component,
            // which never matches the integer day_index column — round to a whole day count.
            $dayIndex = (int) $weekStart->startOfDay()->diffInDays($tomorrow->copy()->startOfDay());

            $day = $user->mealPlans()
                ->where('week_start_date', $weekStart->toDateString())
                ->where('day_index', $dayIndex)
                ->first();

            if (! $day) {
                try {
                    $generator->generateWeek($user, $weekStart);
                } catch (Throwable $e) {
                    $this->error("Plan generation failed for user {$user->id}: {$e->getMessage()}");

                    continue;
                }

                $day = $user->mealPlans()
                    ->where('week_start_date', $weekStart->toDateString())
                    ->where('day_index', $dayIndex)
                    ->first();
            }

            if (! $day) {
                continue;
            }

            $result = $emailer->sendDayPlan($user, $day);

            if ($result['sent'] > 0) {
                $user->forceFill(['last_plan_emailed_at' => now()])->save();
                $this->info("Emailed tomorrow's plan to user {$user->id}.");
            } else {
                $this->error("Failed to email plan to user {$user->id}: " . implode(' ', $result['errors']));
            }
        }

        return self::SUCCESS;
    }

    /** Guards against double-sending if the scheduler's 15-minute tick overlaps the dispatch hour twice. */
    protected function alreadySentToday(User $user, Carbon $now): bool
    {
        if (! $user->last_plan_emailed_at) {
            return false;
        }

        return $user->last_plan_emailed_at->betweenIncluded(
            $now->copy()->startOfDay()->utc(),
            $now->copy()->endOfDay()->utc(),
        );
    }
}
