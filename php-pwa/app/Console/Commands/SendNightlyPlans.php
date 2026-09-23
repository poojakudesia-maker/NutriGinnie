<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\DietPlanGenerator;
use App\Services\WhatsApp\WhatsAppDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Runs every 15 minutes (see routes/console.php). For each user whose local
 * clock currently matches their chosen dispatch_hour, generates tomorrow's
 * plan if it doesn't exist yet and sends the combined diet + grocery
 * WhatsApp message — mirroring the "send tonight for tomorrow" cadence.
 */
#[Signature('app:send-nightly-plans')]
#[Description('Send each user their diet + grocery plan for tomorrow via WhatsApp, at their chosen local hour.')]
class SendNightlyPlans extends Command
{
    public function handle(DietPlanGenerator $generator, WhatsAppDispatcher $dispatcher): int
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
            $dayIndex = $weekStart->diffInDays($tomorrow);

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

            $dispatcher->sendDayPlan($user, $day);
            $this->info("Sent tomorrow's plan to user {$user->id}.");
        }

        return self::SUCCESS;
    }

    protected function alreadySentToday(User $user, Carbon $now): bool
    {
        return $user->whatsappLogs()
            ->where('message_type', 'DIET_TEXT')
            ->where('status', 'SENT')
            ->whereBetween('sent_at', [
                $now->copy()->startOfDay()->utc(),
                $now->copy()->endOfDay()->utc(),
            ])
            ->exists();
    }
}
