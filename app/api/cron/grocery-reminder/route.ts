import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { sendGroceryListToUser } from "@/lib/whatsapp/dispatch";
import { buildGroceryListForDay } from "@/lib/grocery/aggregator";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

export const maxDuration = 60;

/**
 * GET /api/cron/grocery-reminder — runs every day at 5 PM (see vercel.json).
 * Sends tomorrow's aggregated grocery list to all users with WhatsApp numbers configured.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const weekStart = weekStartDate(tomorrow);
  const dayIndex = dayIndexFromDate(tomorrow, weekStart);

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

    const items = buildGroceryListForDay(dayPlan);
    await prisma.grocery.upsert({
      where: { userId_forDate: { userId: user.id, forDate: tomorrow } },
      update: { items: items as unknown as Prisma.InputJsonValue },
      create: { userId: user.id, forDate: tomorrow, items: items as unknown as Prisma.InputJsonValue },
    });

    await sendGroceryListToUser(user, mealPlan.dayLabel, items);
    sent++;
  }

  return NextResponse.json({ sent, skipped, totalUsers: users.length });
}
