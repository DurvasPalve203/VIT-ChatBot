// Extracts plain text from PDF, DOCX, or TXT files in the browser.
import * as pdfjsLib from "pdfjs-dist";
// Use the bundled worker via Vite's ?url import
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - vite worker url import
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = await file.arrayBuffer();

  if (name.endsWith(".pdf")) {
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const pageText = tc.items.map((it: any) => ("str" in it ? it.str : "")).join(" ");
      out += pageText + "\n\n";
    }
    return out.trim();
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return (result.value || "").trim();
  }

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return new TextDecoder().decode(buf).trim();
  }

  throw new Error("Unsupported file type. Please upload PDF, DOCX, TXT, or MD.");
}
