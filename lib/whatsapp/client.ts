import twilio from "twilio";

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      throw new Error("TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set.");
    }
    _client = twilio(sid, token);
  }
  return _client;
}

function toWhatsAppAddress(e164Number: string): string {
  return e164Number.startsWith("whatsapp:") ? e164Number : `whatsapp:${e164Number}`;
}

export interface SendResult {
  providerMessageId: string;
  status: string;
}

/** Sends a plain text WhatsApp message via the Twilio WhatsApp API. */
export async function sendWhatsAppText(toNumber: string, body: string): Promise<SendResult> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error("TWILIO_WHATSAPP_FROM is not set.");

  const client = getClient();
  const message = await client.messages.create({
    from: toWhatsAppAddress(from),
    to: toWhatsAppAddress(toNumber),
    body,
  });

  return { providerMessageId: message.sid, status: message.status };
}

/**
 * Sends a voice-note as a WhatsApp media message. `mediaUrl` must be a
 * publicly reachable HTTPS URL (e.g. an S3/Vercel Blob URL) pointing at the
 * TTS-generated audio file — Twilio fetches it server-side, it cannot be a
 * local file path.
 */
export async function sendWhatsAppVoiceNote(toNumber: string, mediaUrl: string, caption?: string): Promise<SendResult> {
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) throw new Error("TWILIO_WHATSAPP_FROM is not set.");

  const client = getClient();
  const message = await client.messages.create({
    from: toWhatsAppAddress(from),
    to: toWhatsAppAddress(toNumber),
    body: caption,
    mediaUrl: [mediaUrl],
  });

  return { providerMessageId: message.sid, status: message.status };
}

/**
 * Alternative transport: Meta WhatsApp Cloud API (used instead of Twilio
 * when META_WHATSAPP_TOKEN is configured). Kept as a thin, swappable
 * implementation behind the same SendResult shape — see README for setup.
 */
export async function sendMetaCloudTemplate(toNumber: string, templateName: string, params: string[]): Promise<SendResult> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID are not set.");
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toNumber.replace("+", ""),
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: params.map((text) => ({ type: "text", text })),
          },
        ],
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Meta WhatsApp Cloud API error (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as { messages?: { id: string }[] };
  return { providerMessageId: data.messages?.[0]?.id ?? "unknown", status: "sent" };
}
