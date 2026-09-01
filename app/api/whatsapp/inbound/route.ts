import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateMealFromPhoto, type SupportedImageMediaType } from "@/lib/ai/mealPhotoEstimator";
import { localDateUTCMidnight, localDateParts } from "@/lib/utils";
import type { MealLogSlot } from "@prisma/client";

function twiml(message: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

async function fetchTwilioMedia(mediaUrl: string): Promise<{ base64: string; mediaType: string } | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;

  const res = await fetch(mediaUrl, { headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` } });
  if (!res.ok) return null;
  const mediaType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { base64: buffer.toString("base64"), mediaType };
}

/**
 * POST /api/whatsapp/inbound — Twilio inbound-message webhook (configure this URL as the "A
 * message comes in" webhook for your WhatsApp sender). Lets a user reply to their nightly
 * reminder with a photo of their plate to log it, per the "reply with a photo of your plate"
 * flow — Claude vision estimates the meal, it's saved as a MealLog, and we reply with a
 * confirmation over the same TwiML response (no separate outbound send / template needed, since
 * this is a reply within the user-initiated session window).
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const from = form.get("From")?.toString().replace(/^whatsapp:/, "");
  const numMedia = Number(form.get("NumMedia") ?? "0");
  const mediaUrl = form.get("MediaUrl0")?.toString();
  const body = form.get("Body")?.toString().trim();

  if (!from) return twiml("Sorry, I couldn't read that message.");

  const user = await prisma.user.findFirst({ where: { whatsappNumbers: { has: from } } });
  if (!user) return twiml("This number isn't linked to a NutriPing account yet.");

  if (numMedia > 0 && mediaUrl) {
    const media = await fetchTwilioMedia(mediaUrl);
    if (!media) {
      return twiml("Got your photo but couldn't download it — please try sending it again.");
    }
    try {
      const estimate = await estimateMealFromPhoto(media.base64, media.mediaType as SupportedImageMediaType, body);
      const now = new Date();
      const { hour } = localDateParts(now, user.timezone);
      const slot = inferSlotFromHour(hour);
      const forDate = localDateUTCMidnight(now, user.timezone, 0);

      await prisma.mealLog.upsert({
        where: { userId_forDate_slot: { userId: user.id, forDate, slot } },
        update: {
          method: "PHOTO",
          description: body || estimate.name,
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
          description: body || estimate.name,
          calories: estimate.calories,
          proteinG: estimate.proteinG,
          carbsG: estimate.carbsG,
          fatG: estimate.fatG,
          aiEstimated: true,
          photoDataUrl: `data:${media.mediaType};base64,${media.base64}`,
        },
      });

      return twiml(
        `Logged! 🍽️ Looks like ${estimate.name} (~${Math.round(estimate.calories)} kcal, ${Math.round(estimate.proteinG)}g protein) — saved under today's ${slot.toLowerCase()}. Open the app to edit if that's off.`
      );
    } catch {
      return twiml("Got your photo but couldn't estimate it right now — you can log it manually in the app instead.");
    }
  }

  return twiml("Reply with a photo of your plate to log a meal, or open the app to see today's plan.");
}
