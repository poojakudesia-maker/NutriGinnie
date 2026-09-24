<?php

namespace App\Services\WhatsApp;

use App\Models\MealPlan;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppDispatcher
{
    public function __construct(protected MetaWhatsAppClient $client)
    {
    }

    /** Numbers to deliver to: the JSON whatsapp_numbers list, falling back to the mobile number given at signup. */
    protected function numbersFor(User $user): array
    {
        if (! empty($user->whatsapp_numbers)) {
            return $user->whatsapp_numbers;
        }

        return $user->mobile_number ? [$user->mobile_number] : [];
    }

    /**
     * Sends the given day's diet + grocery message to every WhatsApp number on the account.
     * Uses the approved Utility template (single {{1}} body variable = the full formatted message),
     * since this is a business-initiated send outside any active chat session.
     *
     * @return array{sent: int, failed: int, errors: array<int, string>}
     */
    public function sendDayPlan(User $user, MealPlan $day): array
    {
        $numbers = $this->numbersFor($user);
        if (empty($numbers)) {
            return ['sent' => 0, 'failed' => 0, 'errors' => ['No WhatsApp number on file — add one in Profile settings.']];
        }

        $groceries = $user->groceries()
            ->whereDate('for_date', $day->week_start_date->copy()->addDays($day->day_index))
            ->first();

        $items = collect($groceries?->items ?? []);
        $text = WhatsAppMessageFormatter::dietAndGrocery($user, $day, $items);
        $templateName = config('services.meta_whatsapp.template_name');

        $sent = 0;
        $failed = 0;
        $errors = [];

        foreach ($numbers as $number) {
            $error = $this->logAndSend($user, $number, 'DIET_TEXT', $text, function () use ($number, $text, $templateName) {
                if (! $templateName) {
                    throw new \RuntimeException('WHATSAPP_TEMPLATE_NAME is not configured.');
                }

                return $this->client->sendTemplate($number, $templateName, [$text]);
            });

            if ($error === null) {
                $sent++;
            } else {
                $failed++;
                $errors[] = "{$number}: {$error}";
            }
        }

        return ['sent' => $sent, 'failed' => $failed, 'errors' => $errors];
    }

    /** Returns null on success, or the error message on failure. */
    protected function logAndSend(User $user, string $phoneNumber, string $messageType, string $preview, callable $send): ?string
    {
        try {
            $result = $send();

            $user->whatsappLogs()->create([
                'phone_number' => $phoneNumber,
                'message_type' => $messageType,
                'status' => 'SENT',
                'provider_message_id' => $result['provider_message_id'],
                'payload_preview' => mb_substr($preview, 0, 200),
                'sent_at' => now(),
            ]);

            return null;
        } catch (Throwable $e) {
            Log::warning('WhatsApp send failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            $user->whatsappLogs()->create([
                'phone_number' => $phoneNumber,
                'message_type' => $messageType,
                'status' => 'FAILED',
                'error_message' => mb_substr($e->getMessage(), 0, 500),
                'payload_preview' => mb_substr($preview, 0, 200),
            ]);

            return $e->getMessage();
        }
    }
}
