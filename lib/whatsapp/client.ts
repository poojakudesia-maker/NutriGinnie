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
 * Provider-aware entry point for the PROACTIVE (business-initiated) text sends — the nightly diet
 * + grocery message and the manual "send now" buttons. WhatsApp Business policy only allows
 * freeform text (sendWhatsAppText) within a 24-hour customer-service window after the user last
 * messaged in; a message sent outside that window (like a nightly reminder nobody replied to)
 * needs a pre-approved Utility-category template instead, or Meta/Twilio will reject it.
 *
 * Set WHATSAPP_PROVIDER=meta_template (+ WHATSAPP_TEMPLATE_NAME, pointing at an approved template
 * whose body is a single {{1}} variable) once you have one approved; the full formatted message is
 * passed as that one parameter. Defaults to the Twilio freeform path, which is fine for sandbox
 * testing but will start failing in production outside the 24h window.
 */
export async function sendWhatsAppMessage(toNumber: string, body: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "twilio";
  if (provider === "meta_template") {
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    if (!templateName) {
      throw new Error("WHATSAPP_PROVIDER=meta_template requires WHATSAPP_TEMPLATE_NAME to be set.");
    }
    return sendMetaCloudTemplate(toNumber, templateName, [body]);
  }
  return sendWhatsAppText(toNumber, body);
}

/**
 * Meta WhatsApp Cloud API transport, used directly by sendWhatsAppMessage()
 * when WHATSAPP_PROVIDER=meta_template, and available standalone for any
 * other approved template you want to send outside that path.
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
