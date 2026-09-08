import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/water?userId=...&date=YYYY-MM-DD — today's water intake total + entries. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const day = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const end = new Date(start.getTime() + 86_400_000);

  const logs = await prisma.waterLog.findMany({
    where: { userId, loggedAt: { gte: start, lt: end } },
    orderBy: { loggedAt: "asc" },
  });
  const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);

  return NextResponse.json({ logs, totalMl });
}

/** POST /api/water — { userId, amountMl } log a glass/bottle of water. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const amountMl = Number(body?.amountMl);
  if (!body?.userId || !Number.isFinite(amountMl) || amountMl <= 0 || amountMl > 5000) {
    return NextResponse.json({ error: "userId and a valid amountMl are required" }, { status: 400 });
  }

  const log = await prisma.waterLog.create({ data: { userId: body.userId, amountMl } });
  return NextResponse.json({ log }, { status: 201 });
}
