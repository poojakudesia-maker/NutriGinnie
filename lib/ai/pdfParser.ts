import { PDFParse } from "pdf-parse";

/** Extracts raw text from an uploaded diet-plan PDF. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error("Could not extract any text from the PDF. It may be a scanned image without OCR.");
    }
    return text;
  } finally {
    await parser.destroy();
  }
}
