import { describe, expect, it } from "vitest";
import { classifyClauses } from "../../src/lib/riskScoring";
const levels = (point: string) =>
  classifyClauses({ simplifiedText: "", keyPoints: [point], caveats: [] })[0].level;
describe("clause risk scoring", () => {
  it("classifies high liability", () => expect(levels("You indemnify them.")).toBe("high"));
  it("classifies medium renewal", () => expect(levels("This renews annually.")).toBe("medium"));
  it("classifies low ordinary clause", () =>
    expect(levels("Parties exchange notices.")).toBe("low"));
});
