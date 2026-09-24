import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** DELETE /api/recipes/[id]?userId=... — remove a single saved recipe. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe || recipe.userId !== userId) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
