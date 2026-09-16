import type { SimplifiedResult } from "./gemini";

export type ClauseRisk = "low" | "medium" | "high";

export function classifyClauses(result: SimplifiedResult): Array<{ point: string; level: ClauseRisk }> {
  return result.keyPoints.map((point) => ({
    point,
    level: /indemn|liability|waiv|guarantee/i.test(point)
      ? "high"
      : /penalt|fee|renew|arbitrat|terminat/i.test(point)
        ? "medium"
        : "low"
  }));
}