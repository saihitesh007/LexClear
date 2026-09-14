export type DocumentKind = "pdf" | "docx" | "image" | "text";
export interface ParsedDocument { kind: DocumentKind; text: string; requiresOcr: boolean; }
/** Pure routing helper; binary extraction is performed server-side. */
export function parseDocument(name: string, text = ""): ParsedDocument {
  const suffix = name.split(".").pop()?.toLowerCase();
  const kind: DocumentKind = suffix === "pdf" ? "pdf" : suffix === "docx" ? "docx" : ["png", "jpg", "jpeg", "webp"].includes(suffix ?? "") ? "image" : "text";
  return { kind, text: text.replace(/\s+/g, " ").trim(), requiresOcr: kind === "image" };
}
