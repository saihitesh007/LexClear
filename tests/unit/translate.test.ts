import { expect, it, vi } from "vitest";
import { translateWithFallback } from "../../src/lib/translate";

it("keeps source text on translation failure", async () => {
  const r = await translateWithFallback(
    ["English text"],
    "hi",
    vi.fn().mockRejectedValue(new Error())
  );
  expect(r).toEqual({ texts: ["English text"], fallback: true });
});
