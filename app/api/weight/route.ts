import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/weight?userId=... — weight history for the tracking graph. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const logs = await prisma.weightLog.findMany({ where: { userId }, orderBy: { loggedAt: "asc" } });
  return NextResponse.json({ logs });
}

/** POST /api/weight — { userId, weightKg } log a new weigh-in. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const weightKg = Number(body?.weightKg);
  if (!body?.userId || !Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    return NextResponse.json({ error: "userId and a valid weightKg are required" }, { status: 400 });
  }

  const log = await prisma.weightLog.create({ data: { userId: body.userId, weightKg } });
  await prisma.user.update({ where: { id: body.userId }, data: { weightKg } });

  return NextResponse.json({ log }, { status: 201 });
}
