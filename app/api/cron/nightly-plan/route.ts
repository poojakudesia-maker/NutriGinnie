import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { sendNightlyPlanToUser } from "@/lib/whatsapp/dispatch";
import { buildGroceryListForDay } from "@/lib/grocery/aggregator";
import { weekStartDate, dayIndexFromDate, localDateParts, localDateUTCMidnight } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

export const maxDuration = 60;

// Must divide evenly into 60 and match this route's cron cadence (vercel.json / scripts/scheduler.ts)
// so every user's dispatchHour gets exactly one matching window per day.
const RUN_INTERVAL_MINUTES = 30;
// A user is skipped for de-dupe if they already got a DIET_TEXT send more recently than this —
// keeps a re-run within the same window from double-sending without needing a "last sent" column.
const DEDUPE_WINDOW_MS = 20 * 60 * 60 * 1000;

/**
 * GET /api/cron/nightly-plan — intended to run every RUN_INTERVAL_MINUTES (see vercel.json /
 * scripts/scheduler.ts). Each user is sent ONE combined WhatsApp message (diet plan + grocery
 * list) plus the diet-plan voice note, for the NEXT DAY IN THEIR OWN TIMEZONE, at their own
 * configured dispatchHour (default 7 PM) — e.g. a user in Asia/Kolkata with dispatchHour=19 gets
 * their Aug 5 plan at 7 PM IST on Aug 4; a user in America/New_York with the same setting gets it
 * at 7 PM Eastern instead, computed independently of the server's own clock/timezone.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const users = await prisma.user.findMany({
    where: { whatsappNumbers: { isEmpty: false }, whatsappRemindersEnabled: true },
  });

  let sent = 0;
  let skipped = 0;
  let outsideWindow = 0;

  for (const user of users) {
    const { hour, minute } = localDateParts(now, user.timezone);
    if (hour !== user.dispatchHour || minute >= RUN_INTERVAL_MINUTES) {
      outsideWindow++;
      continue;
    }

    const recentSend = await prisma.whatsAppLog.findFirst({
      where: { userId: user.id, messageType: "DIET_TEXT", status: "SENT" },
      orderBy: { sentAt: "desc" },
    });
    if (recentSend?.sentAt && now.getTime() - recentSend.sentAt.getTime() < DEDUPE_WINDOW_MS) {
      skipped++;
      continue;
    }

    const tomorrow = localDateUTCMidnight(now, user.timezone, 1);
    const weekStart = weekStartDate(tomorrow);
    const dayIndex = dayIndexFromDate(tomorrow, weekStart);

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

    await sendNightlyPlanToUser(user, dayPlan, items);
    sent++;
  }

  return NextResponse.json({ sent, skipped, outsideWindow, totalUsers: users.length });
}
