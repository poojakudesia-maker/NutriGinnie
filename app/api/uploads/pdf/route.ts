import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/ai/pdfParser";
import { extractDocxText } from "@/lib/ai/docParser";
import { parseRecipesFromText } from "@/lib/ai/recipeParser";
import { toErrorResponse } from "@/lib/api/errors";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** POST /api/uploads/pdf — multipart/form-data with `file` (PDF or DOCX) and `userId`. */
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
  const isPdf = file.type === "application/pdf";
  const isDocx = file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
  if (!isPdf && !isDocx) {
    return NextResponse.json({ error: "Only PDF or DOCX files are supported (legacy .doc is not)." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be smaller than 10MB" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = isPdf ? await extractPdfText(buffer) : await extractDocxText(buffer);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 422 });
  }

  try {
    const structuredRecipes = await parseRecipesFromText(text);

    const created = await prisma.$transaction(
      structuredRecipes.map((recipe) =>
        prisma.recipe.create({
          data: {
            userId,
            name: recipe.name,
            mealType: recipe.mealType,
            source: isPdf ? "PDF" : "DOCX",
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
  } catch (err) {
    return toErrorResponse(err, "Could not process this document.");
  }
}
