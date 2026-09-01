import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mealLogSchema } from "@/lib/validation/schemas";
import { estimateMealFromPhoto, estimateMealFromText, type SupportedImageMediaType } from "@/lib/ai/mealPhotoEstimator";
import { weekStartDate, dayIndexFromDate } from "@/lib/utils";
import { toErrorResponse } from "@/lib/api/errors";
import type { DayPlan, MealEntry } from "@/lib/ai/types";

const SLOT_TO_MEAL_KEY: Record<string, keyof DayPlan["meals"]> = {
  BREAKFAST: "breakfast",
  SNACK1: "snack1",
  LUNCH: "lunch",
  SNACK2: "snack2",
  DINNER: "dinner",
};

/** GET /api/meal-log?userId=...&date=YYYY-MM-DD — this day's logged meals, one per slot. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!userId || !dateParam) {
    return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
  }
  const forDate = new Date(dateParam);
  if (Number.isNaN(forDate.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  const logs = await prisma.mealLog.findMany({ where: { userId, forDate } });
  return NextResponse.json({ logs });
}

/** POST /api/meal-log — record what the user actually ate for one slot (confirm-planned / custom text / photo). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = mealLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const forDate = new Date(input.forDate);
  if (Number.isNaN(forDate.getTime())) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  try {
    let entry: { description: string; calories: number; proteinG: number; carbsG: number; fatG: number; aiEstimated: boolean; photoDataUrl: string | null };

    if (input.method === "PLANNED_CONFIRM") {
      const weekStart = weekStartDate(forDate);
      const dayIndex = dayIndexFromDate(forDate, weekStart);
      const mealPlan = await prisma.mealPlan.findUnique({
        where: { userId_weekStartDate_dayIndex: { userId: input.userId, weekStartDate: weekStart, dayIndex } },
      });
      if (!mealPlan) {
        return NextResponse.json({ error: "No planned meal found for that day — generate a plan first." }, { status: 404 });
      }
      const meals = mealPlan.meals as unknown as DayPlan["meals"];
      const meal: MealEntry = meals[SLOT_TO_MEAL_KEY[input.slot]];
      entry = {
        description: meal.name,
        calories: meal.calories,
        proteinG: meal.proteinG,
        carbsG: meal.carbsG,
        fatG: meal.fatG,
        aiEstimated: false,
        photoDataUrl: null,
      };
    } else if (input.method === "CUSTOM") {
      const { calories, proteinG, carbsG, fatG } = await estimateMealFromText(input.description);
      entry = { description: input.description, calories, proteinG, carbsG, fatG, aiEstimated: true, photoDataUrl: null };
    } else {
      const match = input.photoDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
      if (!match) return NextResponse.json({ error: "Malformed image data URL" }, { status: 400 });
      const [, mediaType, base64Data] = match;
      const { name, calories, proteinG, carbsG, fatG } = await estimateMealFromPhoto(
        base64Data,
        mediaType as SupportedImageMediaType,
        input.description
      );
      entry = {
        description: input.description ?? name,
        calories,
        proteinG,
        carbsG,
        fatG,
        aiEstimated: true,
        photoDataUrl: input.photoDataUrl,
      };
    }

    const log = await prisma.mealLog.upsert({
      where: { userId_forDate_slot: { userId: input.userId, forDate, slot: input.slot } },
      update: { method: input.method, ...entry },
      create: { userId: input.userId, forDate, slot: input.slot, method: input.method, ...entry },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "Could not log this meal.");
  }
}
