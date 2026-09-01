import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/glp1-log?userId=... — recent GLP-1 side-effect log entries. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const logs = await prisma.glp1Log.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 20 });
  return NextResponse.json({ logs });
}

/** POST /api/glp1-log — { userId, nauseaLevel?, hydrationMl?, proteinCompliant?, notes? }. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const nauseaLevel = body.nauseaLevel != null ? Number(body.nauseaLevel) : null;
  const hydrationMl = body.hydrationMl != null ? Number(body.hydrationMl) : null;
  if (nauseaLevel != null && (!Number.isFinite(nauseaLevel) || nauseaLevel < 0 || nauseaLevel > 5)) {
    return NextResponse.json({ error: "nauseaLevel must be between 0 and 5" }, { status: 400 });
  }

  const log = await prisma.glp1Log.create({
    data: {
      userId: body.userId,
      nauseaLevel,
      hydrationMl,
      proteinCompliant: body.proteinCompliant != null ? Boolean(body.proteinCompliant) : null,
      notes: body.notes ? String(body.notes).slice(0, 500) : null,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
