import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, sendWhatsAppVoiceNote } from "./client";
import { formatGroceryMessage, formatDietAndGroceryMessage } from "./templates";
import type { DayPlan, GroceryItem } from "@/lib/ai/types";
import type { User } from "@prisma/client";

function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("APP_URL (public base URL) is not set — required to build the TTS voice-note link.");
  return url.replace(/\/$/, "");
}

/** Voice notes are Twilio-only (Meta's Cloud API can't send freeform audio outside an active chat
 *  session), so they're skipped entirely — not logged as a nightly failure — when Twilio isn't
 *  configured, since that's an expected, permanent state for a Meta-only setup rather than an error. */
function voiceNotesConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM);
}

/** Sends the next day's grocery list to every WhatsApp number on the user's account. */
export async function sendGroceryListToUser(user: User, forDayLabel: string, items: GroceryItem[]): Promise<void> {
  if (user.whatsappNumbers.length === 0) return;

  const text = formatGroceryMessage(user.name, forDayLabel, items);
  for (const phoneNumber of user.whatsappNumbers) {
    await logAndSend(user.id, phoneNumber, "GROCERY_TEXT", text, () => sendWhatsAppMessage(phoneNumber, text));
  }
}

/**
 * The nightly 7 PM send: one combined message with tomorrow's diet plan AND
 * grocery list, plus the diet-plan voice note. This is what
 * /api/cron/nightly-plan calls for every user.
 */
export async function sendNightlyPlanToUser(user: User, day: DayPlan, groceryItems: GroceryItem[]): Promise<void> {
  if (user.whatsappNumbers.length === 0) return;

  const text = formatDietAndGroceryMessage(user.name, day, groceryItems);
  const sendVoice = voiceNotesConfigured();
  const voiceUrl = sendVoice ? `${getAppUrl()}/api/tts/voice?userId=${user.id}&dayIndex=${day.dayIndex}` : null;

  for (const phoneNumber of user.whatsappNumbers) {
    await logAndSend(user.id, phoneNumber, "DIET_TEXT", text, () => sendWhatsAppMessage(phoneNumber, text));
    if (voiceUrl) {
      await logAndSend(user.id, phoneNumber, "DIET_VOICE", "[voice note]", () =>
        sendWhatsAppVoiceNote(phoneNumber, voiceUrl, "🎧 Tomorrow's diet plan, in audio")
      );
    }
  }
}

async function logAndSend(
  userId: string,
  phoneNumber: string,
  messageType: "DIET_TEXT" | "DIET_VOICE" | "GROCERY_TEXT",
  preview: string,
  send: () => Promise<{ providerMessageId: string; status: string }>
): Promise<void> {
  try {
    const result = await send();
    await prisma.whatsAppLog.create({
      data: {
        userId,
        phoneNumber,
        messageType,
        status: "SENT",
        providerMessageId: result.providerMessageId,
        payloadPreview: preview.slice(0, 200),
        sentAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.whatsAppLog.create({
      data: {
        userId,
        phoneNumber,
        messageType,
        status: "FAILED",
        errorMessage: (err as Error).message.slice(0, 500),
        payloadPreview: preview.slice(0, 200),
      },
    });
  }
}
