import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { sendDietPlanToUser } from "@/lib/whatsapp/dispatch";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

export const maxDuration = 60;

/**
 * GET /api/cron/daily-diet — runs every morning at 8 AM (see vercel.json).
 * Sends today's diet plan (text + voice) to all users with WhatsApp numbers configured.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const weekStart = weekStartDate(today);
  const dayIndex = dayIndexFromDate(today, weekStart);

  const users = await prisma.user.findMany({ where: { whatsappNumbers: { isEmpty: false } } });

  let sent = 0;
  let skipped = 0;

  for (const user of users) {
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { userId_weekStartDate_dayIndex: { userId: user.id, weekStartDate: weekStart, dayIndex } },
    });
    if (!mealPlan) {
      skipped++;
      continue;
    }

    const dayPlan: DayPlan = {
      dayIndex: mealPlan.dayIndex,
      dayLabel: mealPlan.dayLabel,
      meals: mealPlan.meals as unknown as DayPlan["meals"],
      totalCalories: mealPlan.totalCalories,
      totalProteinG: mealPlan.totalProteinG,
      totalCarbsG: mealPlan.totalCarbsG,
      totalFatG: mealPlan.totalFatG,
    };

    await sendDietPlanToUser(user, dayPlan);
    sent++;
  }

  return NextResponse.json({ sent, skipped, totalUsers: users.length });
}
