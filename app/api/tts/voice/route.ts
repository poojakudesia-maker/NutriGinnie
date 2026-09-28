import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSpeechMp3 } from "@/lib/tts/client";
import { formatDietPlanVoiceScript } from "@/lib/whatsapp/templates";
import { weekStartDate } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

/**
 * GET /api/tts/voice?userId=...&dayIndex=0..6
 * Publicly-fetchable audio endpoint — this is the URL Twilio's WhatsApp API
 * calls to download the voice-note media, so it must stay unauthenticated
 * and return raw audio bytes.
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const dayIndexParam = req.nextUrl.searchParams.get("dayIndex");
  if (!userId || dayIndexParam === null) {
    return NextResponse.json({ error: "userId and dayIndex are required" }, { status: 400 });
  }
  const dayIndex = Number(dayIndexParam);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { userId_weekStartDate_dayIndex: { userId, weekStartDate: weekStartDate(), dayIndex } },
  });
  if (!mealPlan) return NextResponse.json({ error: "No meal plan for that day" }, { status: 404 });

  const dayPlan: DayPlan = {
    dayIndex: mealPlan.dayIndex,
    dayLabel: mealPlan.dayLabel,
    meals: mealPlan.meals as unknown as DayPlan["meals"],
    totalCalories: mealPlan.totalCalories,
    totalProteinG: mealPlan.totalProteinG,
    totalCarbsG: mealPlan.totalCarbsG,
    totalFatG: mealPlan.totalFatG,
  };

  const script = formatDietPlanVoiceScript(user.name, dayPlan);
  const audio = await generateSpeechMp3(script);

  return new NextResponse(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
