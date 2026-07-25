import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppSchema } from "@/lib/validation/schemas";
import { sendDietPlanToUser, sendGroceryListToUser } from "@/lib/whatsapp/dispatch";
import { buildGroceryListForDay } from "@/lib/grocery/aggregator";
import { weekStartDate, dayIndexFromDate, DAY_LABELS } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

/** POST /api/whatsapp/send — manual "send now" trigger from the UI (diet plan or grocery list). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = sendWhatsAppSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, type, day } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.whatsappNumbers.length === 0) {
    return NextResponse.json({ error: "No WhatsApp numbers configured in Settings" }, { status: 422 });
  }

  const targetDate = day ? new Date(day) : new Date();
  const weekStart = weekStartDate(targetDate);
  const dayIndex = dayIndexFromDate(targetDate, weekStart);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { userId_weekStartDate_dayIndex: { userId, weekStartDate: weekStart, dayIndex } },
  });
  if (!mealPlan) {
    return NextResponse.json({ error: "No meal plan found for that date. Generate the weekly plan first." }, { status: 404 });
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

  if (type === "DIET") {
    await sendDietPlanToUser(user, dayPlan);
  } else {
    const items = buildGroceryListForDay(dayPlan);
    const nextDayLabel = DAY_LABELS[(dayIndex + 1) % 7];
    await sendGroceryListToUser(user, nextDayLabel, items);
  }

  return NextResponse.json({ ok: true });
}
