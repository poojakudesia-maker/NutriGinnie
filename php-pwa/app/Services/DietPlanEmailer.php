<?php

namespace App\Services;

use App\Mail\DietPlanMail;
use App\Models\MealPlan;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class DietPlanEmailer
{
    /**
     * Emails the given day's diet + grocery plan to every address on the account
     * (the signup email, plus an optional second one from Profile settings).
     *
     * @return array{sent: int, failed: int, errors: array<int, string>}
     */
    public function sendDayPlan(User $user, MealPlan $day): array
    {
        $emails = $user->deliveryEmails();

        if (empty($emails)) {
            return ['sent' => 0, 'failed' => 0, 'errors' => ['No delivery email on file.']];
        }

        $groceries = $user->groceries()
            ->whereDate('for_date', $day->week_start_date->copy()->addDays($day->day_index))
            ->first();

        $items = collect($groceries?->items ?? []);

        $sent = 0;
        $failed = 0;
        $errors = [];

        foreach ($emails as $email) {
            try {
                Mail::to($email)->send(new DietPlanMail($user, $day, $items));
                $sent++;
            } catch (Throwable $e) {
                Log::warning('Diet plan email failed', ['user_id' => $user->id, 'email' => $email, 'error' => $e->getMessage()]);
                $failed++;
                $errors[] = "{$email}: {$e->getMessage()}";
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'errors' => $errors];
    }
}
