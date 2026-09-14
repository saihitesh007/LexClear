import { describe, expect, it } from "vitest";
import { extractDates, normalizeDocumentText, scoreRisks } from "./document";

describe("document helpers", () => {
  it("normalizes and bounds document text", () => {
    expect(normalizeDocumentText("  hello\n\nworld ")).toBe("hello world");
  });
  it("flags meaningful contractual risk terms", () => {
    const risks = scoreRisks("The Customer shall indemnify Acme. This agreement automatically renews annually.");
    expect(risks.map((risk) => risk.level)).toEqual(["high", "medium"]);
  });
  it("extracts common written dates", () => {
    expect(extractDates("Due 12/03/2026 and signed on March 4, 2026.")).toEqual(["12/03/2026", "March 4, 2026"]);
  });
});
