/**
 * Extracts raw text from an uploaded diet-plan PDF.
 *
 * pdf-parse (via pdfjs-dist) is notorious for failing at import time on serverless platforms:
 * Vercel's function bundler statically traces which files a package needs, but pdfjs-dist loads
 * some assets (e.g. its worker script) via a dynamically-computed path that tracing can miss, so
 * the import can throw during a cold start. A top-level `import` would make that failure crash the
 * whole module load — uncatchable by any try/catch in this file or its caller, and Next.js then
 * returns its own non-JSON error page instead of a normal API response. Importing it lazily here
 * instead means that failure surfaces as an ordinary thrown error the caller's try/catch handles.
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  let PDFParse: typeof import("pdf-parse").PDFParse;
  try {
    ({ PDFParse } = await import("pdf-parse"));
  } catch (err) {
    console.error("Failed to load pdf-parse:", err);
    throw new Error("The PDF parsing library failed to load on the server. Please try again in a moment.");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error("Could not extract any text from the PDF. It may be a scanned image without OCR.");
    }
    return text;
  } catch (err) {
    console.error("PDF text extraction failed:", err);
    throw err;
  } finally {
    await parser.destroy();
  }
}
