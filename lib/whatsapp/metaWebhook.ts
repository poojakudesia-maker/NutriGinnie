import crypto from "crypto";

/**
 * Shared helpers for Meta's two webhooks (inbound messages + delivery status) — both use the same
 * GET verification handshake and the same X-Hub-Signature-256 request-signing scheme.
 */

/** Handles the one-time GET verification handshake Meta does when you save the webhook URL in the
 *  App Dashboard. Returns the raw text response to send back (the "challenge" string), or null if
 *  the request doesn't match your configured verify token (respond 403 in that case). */
export function verifyMetaWebhookHandshake(searchParams: URLSearchParams): string | null {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return challenge;
  }
  return null;
}

/** Verifies the X-Hub-Signature-256 header Meta signs every webhook POST body with, using your
 *  App Secret — protects against spoofed requests hitting your public webhook URL. */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Downloads a WhatsApp media attachment: Meta's Graph API is a two-step fetch — first resolve the
 *  media ID to a short-lived URL, then download the bytes from that URL, both with the same Bearer token. */
export async function downloadMetaMedia(mediaId: string): Promise<{ base64: string; mediaType: string } | null> {
  const token = process.env.META_WHATSAPP_TOKEN;
  if (!token) return null;

  const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) return null;
  const meta = (await metaRes.json()) as { url?: string; mime_type?: string };
  if (!meta.url) return null;

  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!fileRes.ok) return null;

  const buffer = Buffer.from(await fileRes.arrayBuffer());
  return { base64: buffer.toString("base64"), mediaType: meta.mime_type ?? "image/jpeg" };
}

export interface MetaInboundMessage {
  from: string; // sender's phone number, no "+" prefix
  type: string; // "text" | "image" | ...
  text?: { body: string };
  image?: { id: string; caption?: string };
}

/** Extracts inbound messages from Meta's webhook payload shape:
 *  entry[].changes[].value.messages[]. Returns [] for status-only or malformed payloads. */
export function extractMetaInboundMessages(body: unknown): MetaInboundMessage[] {
  const messages: MetaInboundMessage[] = [];
  const entries = (body as { entry?: unknown[] })?.entry ?? [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const value = (change as { value?: { messages?: MetaInboundMessage[] } })?.value;
      if (value?.messages) messages.push(...value.messages);
    }
  }
  return messages;
}

export interface MetaStatusUpdate {
  id: string; // WhatsApp message id (matches SendResult.providerMessageId)
  status: string; // "sent" | "delivered" | "read" | "failed"
  errors?: { title?: string; message?: string }[];
}

/** Extracts delivery-status updates from Meta's webhook payload shape:
 *  entry[].changes[].value.statuses[]. */
export function extractMetaStatuses(body: unknown): MetaStatusUpdate[] {
  const statuses: MetaStatusUpdate[] = [];
  const entries = (body as { entry?: unknown[] })?.entry ?? [];
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];
    for (const change of changes) {
      const value = (change as { value?: { statuses?: MetaStatusUpdate[] } })?.value;
      if (value?.statuses) statuses.push(...value.statuses);
    }
  }
  return statuses;
}
