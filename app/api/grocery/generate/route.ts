import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildGroceryListForDay } from "@/lib/grocery/aggregator";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import type { DayPlan } from "@/lib/ai/types";

/** POST /api/grocery/generate — { userId, forDate } -> aggregates that day's meal-plan ingredients. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId || !body?.forDate) {
    return NextResponse.json({ error: "userId and forDate are required" }, { status: 400 });
  }

  const forDate = new Date(body.forDate);
  if (Number.isNaN(forDate.getTime())) {
    return NextResponse.json({ error: "forDate must be a valid date" }, { status: 400 });
  }

  const weekStart = weekStartDate(forDate);
  const dayIndex = dayIndexFromDate(forDate, weekStart);

  const mealPlan = await prisma.mealPlan.findUnique({
    where: { userId_weekStartDate_dayIndex: { userId: body.userId, weekStartDate: weekStart, dayIndex } },
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

  const items = buildGroceryListForDay(dayPlan) as unknown as Prisma.InputJsonValue;

  const grocery = await prisma.grocery.upsert({
    where: { userId_forDate: { userId: body.userId, forDate } },
    update: { items },
    create: { userId: body.userId, forDate, items },
  });

  return NextResponse.json({ grocery }, { status: 201 });
}
