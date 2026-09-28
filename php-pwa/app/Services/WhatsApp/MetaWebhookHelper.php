<?php

namespace App\Services\WhatsApp;

class MetaWebhookHelper
{
    /** The one-time GET verification handshake Meta performs when you save the webhook URL. */
    public static function verifyHandshake(string $mode, ?string $token, ?string $challenge): ?string
    {
        $expected = config('services.meta_whatsapp.webhook_verify_token');

        if ($mode === 'subscribe' && $expected && $token === $expected && $challenge) {
            return $challenge;
        }

        return null;
    }

    /** Verifies the X-Hub-Signature-256 header Meta signs every webhook POST body with. */
    public static function verifySignature(string $rawBody, ?string $signatureHeader): bool
    {
        $appSecret = config('services.meta_whatsapp.app_secret');
        if (! $appSecret || ! $signatureHeader) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $rawBody, $appSecret);

        return hash_equals($expected, $signatureHeader);
    }

    /** Extracts inbound messages from entry[].changes[].value.messages[]. */
    public static function extractMessages(array $body): array
    {
        $messages = [];
        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                foreach ($change['value']['messages'] ?? [] as $message) {
                    $messages[] = $message;
                }
            }
        }

        return $messages;
    }

    /** Extracts delivery-status updates from entry[].changes[].value.statuses[]. */
    public static function extractStatuses(array $body): array
    {
        $statuses = [];
        foreach ($body['entry'] ?? [] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                foreach ($change['value']['statuses'] ?? [] as $status) {
                    $statuses[] = $status;
                }
            }
        }

        return $statuses;
    }
}
