import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rawRecipeSchema } from "@/lib/validation/schemas";
import { parseRecipeFromInstagramCaption, parseRecipesFromText } from "@/lib/ai/recipeParser";

/** GET /api/recipes?userId=... — list a user's saved recipes. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const recipes = await prisma.recipe.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ recipes });
}

/**
 * POST /api/recipes — add a recipe from pasted raw text or an Instagram link.
 * (We ask for the caption/recipe text to be pasted alongside the link since
 * Instagram has no public unauthenticated scraping API — see recipeParser.ts.)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = rawRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, text, instagramUrl } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const structuredRecipes = instagramUrl
    ? await parseRecipeFromInstagramCaption(text ?? "", instagramUrl)
    : await parseRecipesFromText(text ?? "");

  const created = await prisma.$transaction(
    structuredRecipes.map((recipe) =>
      prisma.recipe.create({
        data: {
          userId,
          name: recipe.name,
          source: instagramUrl ? "INSTAGRAM" : "MANUAL_TEXT",
          sourceUrl: instagramUrl ?? null,
          rawInput: (text ?? "").slice(0, 5000),
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
}
