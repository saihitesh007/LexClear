import mammoth from "mammoth";
import pdf from "pdf-parse";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "image/png"
  | "image/jpeg";
export interface ParsedDocument {
  text: string;
  needsOcr?: boolean;
}
type PdfExtractor = (buffer: Buffer) => Promise<{ text: string }>;
type DocxExtractor = (input: { buffer: Buffer }) => Promise<{ value: string }>;

/** Extracts embedded text only. OCR is deliberately injected at the API boundary. */
export async function parseDocument(
  buffer: Buffer,
  mimeType: SupportedMimeType,
  extractors: { pdf?: PdfExtractor; docx?: DocxExtractor } = {}
): Promise<ParsedDocument> {
  if (mimeType === "image/png" || mimeType === "image/jpeg") return { text: "", needsOcr: true };
  if (mimeType === "application/pdf") {
    const result = await (extractors.pdf ?? pdf)(buffer);
    const text = result.text.replace(/\s+/g, " ").trim();
    return { text, needsOcr: text.length === 0 };
  }
  const result = await (extractors.docx ?? mammoth.extractRawText)({ buffer });
  const text = result.value.replace(/\s+/g, " ").trim();
  return { text, needsOcr: text.length === 0 };
}
