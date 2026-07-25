import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/ai/pdfParser";
import { parseRecipesFromText } from "@/lib/ai/recipeParser";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB

/** POST /api/uploads/pdf — multipart/form-data with `file` and `userId`. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });

  const userId = form.get("userId");
  const file = form.get("file");

  if (typeof userId !== "string" || !userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF must be smaller than 10MB" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractPdfText(buffer);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  const structuredRecipes = await parseRecipesFromText(text);

  const created = await prisma.$transaction(
    structuredRecipes.map((recipe) =>
      prisma.recipe.create({
        data: {
          userId,
          name: recipe.name,
          source: "PDF",
          rawInput: text.slice(0, 5000),
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
