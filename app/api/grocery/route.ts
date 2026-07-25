import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/grocery?userId=...&date=YYYY-MM-DD — fetch a previously generated grocery list. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const dateParam = req.nextUrl.searchParams.get("date");
  if (!userId || !dateParam) {
    return NextResponse.json({ error: "userId and date are required" }, { status: 400 });
  }

  const forDate = new Date(dateParam);
  if (Number.isNaN(forDate.getTime())) {
    return NextResponse.json({ error: "date must be valid" }, { status: 400 });
  }

  const grocery = await prisma.grocery.findUnique({ where: { userId_forDate: { userId, forDate } } });
  return NextResponse.json({ grocery });
}
