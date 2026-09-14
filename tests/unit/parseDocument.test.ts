import { describe, expect, it, vi } from "vitest";
import { parseDocument } from "../../src/lib/parseDocument";

describe("parseDocument", () => {
  it("extracts clean PDF text", async () => {
    const pdf = vi.fn().mockResolvedValue({ text: " Lease terms " });
    await expect(parseDocument(Buffer.from("pdf"), "application/pdf", { pdf })).resolves.toEqual({ text: "Lease terms", needsOcr: false });
  });
  it("extracts DOCX text", async () => {
    const docx = vi.fn().mockResolvedValue({ value: " Agreement\nterms " });
    await expect(parseDocument(Buffer.from("docx"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document", { docx })).resolves.toEqual({ text: "Agreement terms", needsOcr: false });
  });
  it("marks empty PDF output for Vision OCR fallback", async () => {
    const pdf = vi.fn().mockResolvedValue({ text: "  " });
    await expect(parseDocument(Buffer.from("scan"), "application/pdf", { pdf })).resolves.toEqual({ text: "", needsOcr: true });
  });
});