import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, sendWhatsAppVoiceNote } from "./client";
import { formatDietPlanMessage, formatGroceryMessage } from "./templates";
import type { DayPlan, GroceryItem } from "@/lib/ai/types";
import type { User } from "@prisma/client";

function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!url) throw new Error("APP_URL (public base URL) is not set — required to build the TTS voice-note link.");
  return url.replace(/\/$/, "");
}

/** Sends the daily diet plan (text + voice note) to every WhatsApp number on the user's account. */
export async function sendDietPlanToUser(user: User, day: DayPlan): Promise<void> {
  if (user.whatsappNumbers.length === 0) return;

  const text = formatDietPlanMessage(user.name, day);
  const voiceUrl = `${getAppUrl()}/api/tts/voice?userId=${user.id}&dayIndex=${day.dayIndex}`;

  for (const phoneNumber of user.whatsappNumbers) {
    await logAndSend(user.id, phoneNumber, "DIET_TEXT", text, () => sendWhatsAppText(phoneNumber, text));
    await logAndSend(user.id, phoneNumber, "DIET_VOICE", "[voice note]", () =>
      sendWhatsAppVoiceNote(phoneNumber, voiceUrl, "🎧 Your daily diet plan, in audio")
    );
  }
}

/** Sends the next day's grocery list to every WhatsApp number on the user's account. */
export async function sendGroceryListToUser(user: User, forDayLabel: string, items: GroceryItem[]): Promise<void> {
  if (user.whatsappNumbers.length === 0) return;

  const text = formatGroceryMessage(user.name, forDayLabel, items);
  for (const phoneNumber of user.whatsappNumbers) {
    await logAndSend(user.id, phoneNumber, "GROCERY_TEXT", text, () => sendWhatsAppText(phoneNumber, text));
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
