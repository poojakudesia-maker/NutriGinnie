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
     * Sends tomorrow's diet + grocery message to every WhatsApp number on the account.
     * Uses the approved Utility template (single {{1}} body variable = the full formatted message),
     * since this is a business-initiated send outside any active chat session.
     */
    public function sendDayPlan(User $user, MealPlan $day): void
    {
        $numbers = $this->numbersFor($user);
        if (empty($numbers)) {
            return;
        }

        $groceries = $user->groceries()
            ->whereDate('for_date', $day->week_start_date->copy()->addDays($day->day_index))
            ->first();

        $items = collect($groceries?->items ?? []);
        $text = WhatsAppMessageFormatter::dietAndGrocery($user, $day, $items);
        $templateName = config('services.meta_whatsapp.template_name');

        foreach ($numbers as $number) {
            $this->logAndSend($user, $number, 'DIET_TEXT', $text, function () use ($number, $text, $templateName) {
                if (! $templateName) {
                    throw new \RuntimeException('WHATSAPP_TEMPLATE_NAME is not configured.');
                }

                return $this->client->sendTemplate($number, $templateName, [$text]);
            });
        }
    }

    protected function logAndSend(User $user, string $phoneNumber, string $messageType, string $preview, callable $send): void
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
        } catch (Throwable $e) {
            Log::warning('WhatsApp send failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            $user->whatsappLogs()->create([
                'phone_number' => $phoneNumber,
                'message_type' => $messageType,
                'status' => 'FAILED',
                'error_message' => mb_substr($e->getMessage(), 0, 500),
                'payload_preview' => mb_substr($preview, 0, 200),
            ]);
        }
    }
}
