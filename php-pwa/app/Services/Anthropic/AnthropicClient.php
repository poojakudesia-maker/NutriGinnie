<?php

namespace App\Services\Anthropic;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AnthropicClient
{
    protected string $apiKey;

    protected string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.anthropic.key');
        $this->model = (string) config('services.anthropic.model', 'claude-sonnet-4-5');
    }

    /**
     * Send a messages request and return the concatenated text of the response.
     *
     * @param  array<int, array<string, mixed>>  $messages
     */
    public function textResponse(array $messages, ?string $system = null, int $maxTokens = 4096, float $temperature = 0.4): string
    {
        if ($this->apiKey === '') {
            throw new RuntimeException('ANTHROPIC_API_KEY is not configured.');
        }

        $payload = [
            'model' => $this->model,
            'max_tokens' => $maxTokens,
            'temperature' => $temperature,
            'messages' => $messages,
        ];

        if ($system !== null) {
            $payload['system'] = $system;
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->timeout(120)->post('https://api.anthropic.com/v1/messages', $payload);

        if ($response->failed()) {
            throw new RuntimeException('Anthropic API error: ' . $response->status() . ' ' . $response->body());
        }

        $blocks = $response->json('content', []);

        return collect($blocks)
            ->filter(fn ($block) => ($block['type'] ?? null) === 'text')
            ->pluck('text')
            ->implode("\n");
    }

    /**
     * Extract the first JSON object/array from a model response, tolerating
     * markdown code fences and leading/trailing prose.
     */
    public static function extractJson(string $text): ?array
    {
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/', '', $text);

        $start = null;
        foreach (['{', '['] as $opener) {
            $pos = strpos($text, $opener);
            if ($pos !== false && ($start === null || $pos < $start)) {
                $start = $pos;
            }
        }

        if ($start === null) {
            return null;
        }

        $candidate = substr($text, $start);
        $decoded = json_decode($candidate, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return $decoded;
        }

        // Trim trailing characters after the last closing brace/bracket and retry.
        $lastBrace = max(strrpos($candidate, '}'), strrpos($candidate, ']'));
        if ($lastBrace !== false) {
            $decoded = json_decode(substr($candidate, 0, $lastBrace + 1), true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    public static function documentBlock(string $base64Pdf, string $mediaType = 'application/pdf'): array
    {
        return [
            'type' => 'document',
            'source' => [
                'type' => 'base64',
                'media_type' => $mediaType,
                'data' => $base64Pdf,
            ],
        ];
    }
}
