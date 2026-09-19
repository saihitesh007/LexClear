import { afterEach, describe, expect, it, vi } from "vitest";
import { translateResult } from "../../src/lib/translationClient";

const result = {
  simplifiedText: "Summary",
  keyPoints: ["Point 1", "Point 2"],
  caveats: ["Caveat 1"],
  glossary: [
    { term: "Term 1", definition: "Definition 1" },
    { term: "Term 2", definition: "Definition 2" },
  ],
};

const mockResponse = (texts: string[]) =>
  new Response(JSON.stringify({ data: texts.map((t) => "translated: " + t) }));

afterEach(() => vi.unstubAllGlobals());

describe("translateResult", () => {
  it("makes exactly ONE fetch API call to translate all text fragments in a single batch", async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      const body = JSON.parse(init?.body as string) as {
        texts: string[];
        target: string;
      };
      return Promise.resolve(mockResponse(body.texts));
    });
    vi.stubGlobal("fetch", fetchMock);

    const translation = await translateResult(result, "hi");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(translation.fallback).toBe(false);
    expect(translation.data.simplifiedText).toBe("translated: Summary");
    expect(translation.data.keyPoints).toEqual(["translated: Point 1", "translated: Point 2"]);
    expect(translation.data.caveats).toEqual(["translated: Caveat 1"]);
    expect(translation.data.glossary).toEqual([
      { term: "Term 1", definition: "translated: Definition 1" },
      { term: "Term 2", definition: "translated: Definition 2" },
    ]);
  });

  it("handles overall API fallback when batched translation fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("API unavailable"));
    vi.stubGlobal("fetch", fetchMock);

    const translated = await translateResult(result, "hi");
    expect(translated.fallback).toBe(true);
    expect(translated.data.simplifiedText).toBe("Summary");
    expect(translated.data.keyPoints).toEqual(["Point 1", "Point 2"]);
    expect(translated.data.caveats).toEqual(["Caveat 1"]);
    expect(translated.data.glossary).toEqual([
      { term: "Term 1", definition: "Definition 1" },
      { term: "Term 2", definition: "Definition 2" },
    ]);
  });
});
