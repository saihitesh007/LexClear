import { afterEach, describe, expect, it, vi } from "vitest";
import { translateResult } from "../../src/lib/translationClient";

const result = {
  simplifiedText: "Summary",
  keyPoints: ["Point"],
  caveats: ["Caveat"],
  glossary: [{ term: "Term", definition: "Definition" }],
};
const response = (text: string) => new Response(JSON.stringify({ data: text }));

afterEach(() => vi.unstubAllGlobals());

describe("translateResult", () => {
  it("starts independent translations concurrently", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchMock = vi.fn(() => gate.then(() => response("translated")));
    vi.stubGlobal("fetch", fetchMock);

    const translation = translateResult(result, "hi");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    release?.();
    await expect(translation).resolves.toMatchObject({ fallback: false });
  });

  it("keeps successful pieces when one translation falls back", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response("definition translated"))
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(response("point translated"))
      .mockResolvedValueOnce(response("caveat translated"));
    vi.stubGlobal("fetch", fetchMock);

    const translated = await translateResult(result, "hi");
    expect(translated.fallback).toBe(true);
    expect(translated.data.simplifiedText).toBe("Summary");
    expect(translated.data.keyPoints).toEqual(["point translated"]);
    expect(translated.data.caveats).toEqual(["caveat translated"]);
    expect(translated.data.glossary).toEqual([
      { term: "Term", definition: "definition translated" },
    ]);
  });
});
