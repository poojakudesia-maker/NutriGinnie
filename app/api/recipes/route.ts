import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rawRecipeBatchSchema, detectVideoPlatform } from "@/lib/validation/schemas";
import { parseRecipeFromVideoCaption, parseRecipesFromText } from "@/lib/ai/recipeParser";
import { fetchYouTubeTranscript } from "@/lib/ai/youtubeTranscript";

// Vercel's platform-default timeout (10s on Hobby) is too short for multiple Claude parsing
// calls across a batch of entries; without this the function gets killed mid-request.
export const maxDuration = 60;

/** GET /api/recipes?userId=... — list a user's saved recipes. */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const recipes = await prisma.recipe.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ recipes });
}

/** DELETE /api/recipes?userId=... — clear every saved recipe for the user (e.g. to start over
 *  with a fresh diet-plan upload instead of mixing in the old one). Existing MealPlan/Grocery
 *  rows are left as-is; regenerate the weekly plan afterward to pick up the change. */
export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const { count } = await prisma.recipe.deleteMany({ where: { userId } });
  return NextResponse.json({ deleted: count });
}

interface EntryResult {
  index: number;
  ok: boolean;
  error?: string;
  recipeCount?: number;
}

/**
 * POST /api/recipes — add one or more recipes in a single submission, each
 * from pasted raw text and/or an Instagram/YouTube link. Entries are
 * processed independently so one failure (e.g. a video with no captions)
 * doesn't block the others; the response reports a per-entry result.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = rawRecipeBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, entries } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const results: EntryResult[] = [];
  const allCreated = [];

  for (let index = 0; index < entries.length; index++) {
    const { text, videoUrl } = entries[index];
    const platform = videoUrl ? detectVideoPlatform(videoUrl) : null;

    let captionText = text ?? "";
    if (videoUrl && !captionText.trim()) {
      if (platform === "YOUTUBE") {
        try {
          captionText = await fetchYouTubeTranscript(videoUrl);
        } catch (err) {
          results.push({
            index,
            ok: false,
            error: `Couldn't auto-fetch the YouTube transcript (${(err as Error).message}). Please paste the recipe text instead.`,
          });
          continue;
        }
      } else if (platform === "INSTAGRAM") {
        results.push({
          index,
          ok: false,
          error: "Instagram has no public API for fetching captions — please paste the caption/recipe text.",
        });
        continue;
      }
    }

    try {
      const structuredRecipes = videoUrl
        ? await parseRecipeFromVideoCaption(captionText, videoUrl)
        : await parseRecipesFromText(captionText);

      const created = await prisma.$transaction(
        structuredRecipes.map((recipe) =>
          prisma.recipe.create({
            data: {
              userId,
              name: recipe.name,
              mealType: recipe.mealType,
              source: platform ?? "MANUAL_TEXT",
              sourceUrl: videoUrl ?? null,
              rawInput: captionText.slice(0, 5000),
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

      allCreated.push(...created);
      results.push({ index, ok: true, recipeCount: created.length });
    } catch (err) {
      results.push({ index, ok: false, error: (err as Error).message || "Could not process this recipe." });
    }
  }

  const anySucceeded = results.some((r) => r.ok);
  return NextResponse.json({ recipes: allCreated, results }, { status: anySucceeded ? 201 : 422 });
}
