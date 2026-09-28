<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Meta WhatsApp Business Cloud API client (NOT Twilio). Proactive sends (the
 * nightly diet + grocery message) must use an approved Utility template,
 * since WhatsApp only allows freeform text as a reply within the 24h
 * customer-service window opened by the user's own inbound message.
 */
class MetaWhatsAppClient
{
    public function __construct(
        protected ?string $token = null,
        protected ?string $phoneNumberId = null,
    ) {
        $this->token ??= config('services.meta_whatsapp.token');
        $this->phoneNumberId ??= config('services.meta_whatsapp.phone_number_id');
    }

    /** @return array{provider_message_id: string, status: string} */
    public function sendTemplate(string $toNumber, string $templateName, array $bodyParams): array
    {
        return $this->post([
            'to' => $this->normalize($toNumber),
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => 'en'],
                'components' => [[
                    'type' => 'body',
                    'parameters' => array_map(fn ($text) => ['type' => 'text', 'text' => $text], $bodyParams),
                ]],
            ],
        ]);
    }

    /**
     * Freeform text — only valid as a reply within an active 24h session
     * opened by the user's own inbound message.
     */
    public function sendText(string $toNumber, string $body): array
    {
        return $this->post([
            'to' => $this->normalize($toNumber),
            'type' => 'text',
            'text' => ['body' => $body],
        ]);
    }

    protected function post(array $payload): array
    {
        if (! $this->token || ! $this->phoneNumberId) {
            throw new RuntimeException('META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID are not configured.');
        }

        $response = Http::withToken($this->token)
            ->timeout(30)
            ->post("https://graph.facebook.com/v20.0/{$this->phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                ...$payload,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('Meta WhatsApp Cloud API error (' . $response->status() . '): ' . $response->body());
        }

        return [
            'provider_message_id' => $response->json('messages.0.id', 'unknown'),
            'status' => 'sent',
        ];
    }

    protected function normalize(string $number): string
    {
        return ltrim($number, '+');
    }
}
