<?php

namespace App\Http\Controllers;

use App\Models\WhatsappLog;
use App\Services\WhatsApp\MetaWebhookHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /** Meta's one-time GET verification handshake when you save the webhook URL. */
    public function verify(Request $request): Response
    {
        $challenge = MetaWebhookHelper::verifyHandshake(
            (string) $request->query('hub_mode', $request->query('hub.mode')),
            $request->query('hub_verify_token', $request->query('hub.verify_token')),
            $request->query('hub_challenge', $request->query('hub.challenge')),
        );

        if ($challenge === null) {
            return response('Forbidden', 403);
        }

        return response($challenge, 200);
    }

    /** Handles both inbound user messages and delivery-status updates — Meta posts both shapes to the same URL. */
    public function handle(Request $request): Response
    {
        $signature = $request->header('X-Hub-Signature-256');
        if (! MetaWebhookHelper::verifySignature($request->getContent(), $signature)) {
            return response('Invalid signature', 403);
        }

        $body = $request->json()->all();

        foreach (MetaWebhookHelper::extractStatuses($body) as $status) {
            $this->applyStatus($status);
        }

        foreach (MetaWebhookHelper::extractMessages($body) as $message) {
            Log::info('Inbound WhatsApp message', ['from' => $message['from'] ?? null, 'type' => $message['type'] ?? null]);
        }

        return response('OK', 200);
    }

    protected function applyStatus(array $status): void
    {
        $map = ['sent' => 'SENT', 'delivered' => 'DELIVERED', 'read' => 'READ', 'failed' => 'FAILED'];
        $mapped = $map[$status['status'] ?? ''] ?? null;

        if (! $mapped || empty($status['id'])) {
            return;
        }

        WhatsappLog::where('provider_message_id', $status['id'])->update(['status' => $mapped]);
    }
}
