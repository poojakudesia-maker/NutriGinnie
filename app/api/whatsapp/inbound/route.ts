import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateMealFromPhoto, type SupportedImageMediaType } from "@/lib/ai/mealPhotoEstimator";
import { sendMetaText } from "@/lib/whatsapp/client";
import { verifyMetaWebhookHandshake, verifyMetaSignature, extractMetaInboundMessages, downloadMetaMedia } from "@/lib/whatsapp/metaWebhook";
import { localDateUTCMidnight, localDateParts } from "@/lib/utils";
import type { MealLogSlot } from "@prisma/client";

/** GET /api/whatsapp/inbound — Meta's one-time webhook verification handshake (App Dashboard ->
 *  WhatsApp -> Configuration -> Webhook -> Verify and Save calls this). */
export async function GET(req: NextRequest) {
  const challenge = verifyMetaWebhookHandshake(req.nextUrl.searchParams);
  if (!challenge) return new NextResponse("Forbidden", { status: 403 });
  return new NextResponse(challenge, { status: 200 });
}

/** No explicit slot info comes with a photo reply, so infer it from the time of day it arrives
 *  (in the user's own timezone) — matches whichever meal the user most likely just ate. */
function inferSlotFromHour(hour: number): MealLogSlot {
  if (hour < 10) return "BREAKFAST";
  if (hour < 12) return "SNACK1";
  if (hour < 16) return "LUNCH";
  if (hour < 19) return "SNACK2";
  return "DINNER";
}

/**
 * POST /api/whatsapp/inbound — Meta WhatsApp Cloud API inbound-message webhook (configure this
 * URL under WhatsApp -> Configuration -> Webhook, subscribed to the "messages" field). Lets a user
 * reply to their nightly reminder with a photo of their plate to log it — Claude vision estimates
 * the meal, it's saved as a MealLog, and a confirmation is sent back via a real outbound API call
 * (Meta has no synchronous "respond in the webhook body" mechanism like Twilio's TwiML; the reply
 * is a freeform message, valid because it's within the session window the user's own message opened).
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifyMetaSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const messages = extractMetaInboundMessages(body);

  for (const message of messages) {
    const from = `+${message.from}`;
    const user = await prisma.user.findFirst({ where: { whatsappNumbers: { has: from } } });
    if (!user) continue;

    if (message.type === "image" && message.image) {
      const media = await downloadMetaMedia(message.image.id);
      if (!media) {
        await sendMetaText(from, "Got your photo but couldn't download it — please try sending it again.").catch(() => {});
        continue;
      }
      try {
        const estimate = await estimateMealFromPhoto(media.base64, media.mediaType as SupportedImageMediaType, message.image.caption);
        const now = new Date();
        const { hour } = localDateParts(now, user.timezone);
        const slot = inferSlotFromHour(hour);
        const forDate = localDateUTCMidnight(now, user.timezone, 0);
        const description = message.image.caption || estimate.name;

        await prisma.mealLog.upsert({
          where: { userId_forDate_slot: { userId: user.id, forDate, slot } },
          update: {
            method: "PHOTO",
            description,
            calories: estimate.calories,
            proteinG: estimate.proteinG,
            carbsG: estimate.carbsG,
            fatG: estimate.fatG,
            aiEstimated: true,
            photoDataUrl: `data:${media.mediaType};base64,${media.base64}`,
          },
          create: {
            userId: user.id,
            forDate,
            slot,
            method: "PHOTO",
            description,
            calories: estimate.calories,
            proteinG: estimate.proteinG,
            carbsG: estimate.carbsG,
            fatG: estimate.fatG,
            aiEstimated: true,
            photoDataUrl: `data:${media.mediaType};base64,${media.base64}`,
          },
        });

        await sendMetaText(
          from,
          `Logged! 🍽️ Looks like ${estimate.name} (~${Math.round(estimate.calories)} kcal, ${Math.round(estimate.proteinG)}g protein) — saved under today's ${slot.toLowerCase()}. Open the app to edit if that's off.`
        ).catch(() => {});
      } catch {
        await sendMetaText(from, "Got your photo but couldn't estimate it right now — you can log it manually in the app instead.").catch(() => {});
      }
      continue;
    }

    await sendMetaText(from, "Reply with a photo of your plate to log a meal, or open the app to see today's plan.").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
