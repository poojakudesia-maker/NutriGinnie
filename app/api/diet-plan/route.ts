import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { weekStartDate } from "@/lib/utils";

/**
 * GET /api/diet-plan?userId=...&week=YYYY-MM-DD
 * Returns the 7-day plan for the given week (defaults to the current week).
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const weekParam = req.nextUrl.searchParams.get("week");
  const weekStart = weekStartDate(weekParam ? new Date(weekParam) : new Date());

  const days = await prisma.mealPlan.findMany({
    where: { userId, weekStartDate: weekStart },
    orderBy: { dayIndex: "asc" },
  });

  return NextResponse.json({ weekStartDate: weekStart, days });
}
