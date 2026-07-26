import mammoth from "mammoth";

/** Extracts raw text from an uploaded diet-plan Word document (.docx only, not legacy .doc). */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  if (!text) {
    throw new Error("Could not extract any text from the document.");
  }
  return text;
}
