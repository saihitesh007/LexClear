import { describe, expect, it, vi } from "vitest";
import { buildSimplifyPrompt, simplifyWithFallback } from "../../src/lib/gemini";

describe("Gemini simplification", () => {
  it("builds a grounded structured prompt", () => {
    const prompt = buildSimplifyPrompt("Tenant shall pay $200 by 1 June.");
    expect(prompt).toContain("8th-grade");
    expect(prompt).toContain(
      "Preserve every legal obligation, deadline, condition, and monetary figure exactly"
    );
    expect(prompt).toContain("Never invent");
    expect(prompt).toContain("simplifiedText");
  });
  it("returns readable heuristic content when Gemini fails", async () => {
    const invoke = vi.fn().mockRejectedValue(new Error("timeout"));
    const result = await simplifyWithFallback(
      "Tenant shall pay $200 within 10 days. The lease renews annually.",
      invoke
    );
    expect(result.fallback).toBe(true);
    expect(result.data.keyPoints).toContain("Tenant shall pay $200 within 10 days.");
    expect(result.data.caveats[0]).toContain("temporarily unavailable");
  });
});
