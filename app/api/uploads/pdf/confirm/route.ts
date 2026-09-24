import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { confirmUploadSchema } from "@/lib/validation/schemas";
import { toErrorResponse } from "@/lib/api/errors";

export const maxDuration = 60;

/** POST /api/uploads/pdf/confirm — saves the dishes the user reviewed (and possibly edited/
 *  removed) after POST /api/uploads/pdf parsed them. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = confirmUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, source, rawInputPreview, recipes } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  try {
    const created = await prisma.$transaction(
      recipes.map((recipe) =>
        prisma.recipe.create({
          data: {
            userId,
            name: recipe.name,
            mealType: recipe.mealType,
            source,
            rawInput: rawInputPreview,
            ingredients: recipe.ingredients as unknown as Prisma.InputJsonValue,
            instructions: recipe.instructions,
            calories: recipe.calories,
            proteinG: recipe.proteinG,
            carbsG: recipe.carbsG,
            fatG: recipe.fatG,
            fiberG: recipe.fiberG,
            ironMg: recipe.ironMg,
            calciumMg: recipe.calciumMg,
            micros: (recipe.micros ?? {}) as unknown as Prisma.InputJsonValue,
            aiEstimated: recipe.aiEstimated,
          },
        })
      )
    );
    return NextResponse.json({ recipes: created }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err, "Could not save these recipes.");
  }
}
