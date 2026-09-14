import { describe, expect, it } from "vitest";
import { analysisPrompt } from "./prompts";

describe("analysisPrompt", () => {
  it("asks for structured, bounded and grounded output", () => {
    const prompt = analysisPrompt("Lease", "  Terms\napply ");
    expect(prompt).toContain("Return valid JSON");
    expect(prompt).toContain("Terms apply");
    expect(prompt).toContain("Do not give legal advice");
  });
});
