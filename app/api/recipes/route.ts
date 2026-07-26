import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rawRecipeSchema, detectVideoPlatform } from "@/lib/validation/schemas";
import { parseRecipeFromVideoCaption, parseRecipesFromText } from "@/lib/ai/recipeParser";
import { toErrorResponse } from "@/lib/api/errors";

/** GET /api/recipes?userId=... — list a user's saved recipes. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const recipes = await prisma.recipe.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ recipes });
}

/**
 * POST /api/recipes — add a recipe from pasted raw text or an Instagram/YouTube link.
 * (We ask for the caption/description/transcript text to be pasted alongside the
 * link since neither platform has a public unauthenticated scraping API — see
 * recipeParser.ts.)
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = rawRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, text, videoUrl } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const platform = videoUrl ? detectVideoPlatform(videoUrl) : null;

  try {
    const structuredRecipes = videoUrl
      ? await parseRecipeFromVideoCaption(text ?? "", videoUrl)
      : await parseRecipesFromText(text ?? "");

    const created = await prisma.$transaction(
      structuredRecipes.map((recipe) =>
        prisma.recipe.create({
          data: {
            userId,
            name: recipe.name,
            source: platform ?? "MANUAL_TEXT",
            sourceUrl: videoUrl ?? null,
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
  } catch (err) {
    return toErrorResponse(err, "Could not process this recipe.");
  }
}
