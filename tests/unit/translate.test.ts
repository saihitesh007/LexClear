import { afterEach, describe, expect, it, vi } from "vitest";
import { translate, translateWithFallback } from "../../src/lib/translate";

describe("translate function", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns empty array immediately when texts array is empty", async () => {
    const res = await translate([], "hi", "test-key");
    expect(res).toEqual([]);
  });

  it("calls Google Translate API and returns translated texts array", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            translations: [
              { translatedText: "Text 1 in Hindi" },
              { translatedText: "Text 2 in Hindi" },
            ],
          },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const res = await translate(["Text 1", "Text 2"], "hi", "test-key");
    expect(res).toEqual(["Text 1 in Hindi", "Text 2 in Hindi"]);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://translation.googleapis.com/language/translate/v2?key=test-key",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ q: ["Text 1", "Text 2"], target: "hi", format: "text" }),
      })
    );
  });

  it("throws error when HTTP response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(translate(["Text"], "hi", "test-key")).rejects.toThrow(
      "Translation request failed"
    );
  });

  it("throws error when translations response length does not match input texts length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { translations: [{ translatedText: "Only one" }] },
          }),
      })
    );
    await expect(translate(["Text 1", "Text 2"], "hi", "test-key")).rejects.toThrow(
      "Invalid translation response"
    );
  });
});

describe("translateWithFallback", () => {
  it("keeps source text on translation failure", async () => {
    const r = await translateWithFallback(
      ["English text"],
      "hi",
      vi.fn().mockRejectedValue(new Error())
    );
    expect(r).toEqual({ texts: ["English text"], fallback: true });
  });
});
