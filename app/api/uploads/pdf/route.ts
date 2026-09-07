import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractPdfText } from "@/lib/ai/pdfParser";
import { extractDocxText } from "@/lib/ai/docParser";
import { parseRecipesFromText, parseRecipesFromPdfDocument } from "@/lib/ai/recipeParser";
import { toErrorResponse } from "@/lib/api/errors";

// Without this, Vercel falls back to its platform default (10s on Hobby), which a large PDF's
// Claude parsing call easily exceeds — the function gets killed mid-request and returns a
// non-JSON platform error, which the client then (confusingly) reports as "Network error".
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * POST /api/uploads/pdf — multipart/form-data with `file` (PDF or DOCX) and `userId`.
 * Parses the document with AI and returns the extracted dishes for the user to review — nothing
 * is saved here. The client shows a "review extracted meals" step (dish names + mealType, with a
 * chance to fix a mis-tagged slot or drop a bad extraction) and then POSTs the confirmed list to
 * /api/uploads/pdf/confirm to actually persist them.
 */
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

  // A scanned/handwritten PDF has no embedded text layer, so pdf-parse extracts next to nothing —
  // fall back to sending Claude the raw PDF (it reads the page images directly) instead of failing.
  const isScannedPdf = isPdf && text.trim().length < 50;
  const rawInputPreview = isScannedPdf ? "(scanned PDF — text read directly from the document image)" : text.slice(0, 5000);

  try {
    const recipes = isScannedPdf ? await parseRecipesFromPdfDocument(buffer) : await parseRecipesFromText(text);
    return NextResponse.json({ source: isPdf ? "PDF" : "DOCX", rawInputPreview, recipes });
  } catch (err) {
    return toErrorResponse(err, "Could not process this document.");
  }
}
