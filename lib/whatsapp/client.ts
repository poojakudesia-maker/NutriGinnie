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
 * freeform text within a 24-hour customer-service window after the user last messaged in; a
 * message sent outside that window (like a nightly reminder nobody replied to) needs a
 * pre-approved Utility-category template instead, or Meta/Twilio will reject it.
 *
 * Defaults to Meta's Cloud API with an approved template (WHATSAPP_TEMPLATE_NAME, body = a single
 * {{1}} variable, which the full formatted message is passed as). Set WHATSAPP_PROVIDER=twilio to
 * use Twilio's freeform send instead (fine for sandbox testing, but will fail in production
 * outside the 24h window unless you also set up an approved Twilio Content Template).
 */
export async function sendWhatsAppMessage(toNumber: string, body: string): Promise<SendResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? "meta_template";
  if (provider === "twilio") {
    return sendWhatsAppText(toNumber, body);
  }
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!templateName) {
    throw new Error("WHATSAPP_TEMPLATE_NAME is not set — required for the default Meta Cloud API provider.");
  }
  return sendMetaCloudTemplate(toNumber, templateName, [body]);
}

function getMetaCreds(): { token: string; phoneNumberId: string } {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("META_WHATSAPP_TOKEN / META_PHONE_NUMBER_ID are not set.");
  }
  return { token, phoneNumberId };
}

async function postMetaMessage(phoneNumberId: string, token: string, payload: Record<string, unknown>): Promise<SendResult> {
  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Meta WhatsApp Cloud API error (${res.status}): ${errBody}`);
  }

  const data = (await res.json()) as { messages?: { id: string }[] };
  return { providerMessageId: data.messages?.[0]?.id ?? "unknown", status: "sent" };
}

/**
 * Meta WhatsApp Cloud API transport, used directly by sendWhatsAppMessage()
 * by default, and available standalone for any other approved template you
 * want to send outside that path.
 */
export async function sendMetaCloudTemplate(toNumber: string, templateName: string, params: string[]): Promise<SendResult> {
  const { token, phoneNumberId } = getMetaCreds();
  return postMetaMessage(phoneNumberId, token, {
    to: toNumber.replace("+", ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }],
    },
  });
}

/**
 * Freeform Meta text — only valid as a REPLY within the 24h session window opened by the user's
 * own inbound message (e.g. replying to a photo/text they just sent to the inbound webhook). Do
 * NOT use this for proactive sends like the nightly reminder — use sendMetaCloudTemplate/
 * sendWhatsAppMessage for those, or Meta will reject it outside an active session.
 */
export async function sendMetaText(toNumber: string, body: string): Promise<SendResult> {
  const { token, phoneNumberId } = getMetaCreds();
  return postMetaMessage(phoneNumberId, token, {
    to: toNumber.replace("+", ""),
    type: "text",
    text: { body },
  });
}
