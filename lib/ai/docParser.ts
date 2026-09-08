/** Extracts raw text from an uploaded diet-plan Word document (.docx only, not legacy .doc).
 *  Lazily imported (see pdfParser.ts for why) so a load failure is a catchable error, not a crash. */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  let mammoth: typeof import("mammoth");
  try {
    mammoth = (await import("mammoth")).default;
  } catch (err) {
    console.error("Failed to load mammoth:", err);
    throw new Error("The document parsing library failed to load on the server. Please try again in a moment.");
  }

  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  if (!text) {
    throw new Error("Could not extract any text from the document.");
  }
  return text;
}
