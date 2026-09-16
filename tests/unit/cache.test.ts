import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import simplifyHandler, { simplifyCache } from "../../api/simplify";
import * as geminiModule from "../../src/lib/gemini";

function createMockReqRes(body: unknown) {
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1" },
    body,
  } as unknown as VercelRequest;

  let statusCode = 200;
  let jsonBody: unknown = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
    setHeader() {
      return res;
    },
  } as unknown as VercelResponse;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
  };
}

describe("request-level caching", () => {
  beforeEach(() => {
    simplifyCache.clear();
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test-api-key";
  });

  it("returns cached result on identical second call without re-invoking Gemini callGeminiJson", async () => {
    const mockSimplifiedResult: geminiModule.SimplifiedResult = {
      simplifiedText: "Plain language summary of the contract.",
      keyPoints: ["Must pay fee by 1st of month."],
      caveats: [],
    };

    const callGeminiSpy = vi
      .spyOn(geminiModule, "callGeminiJson")
      .mockResolvedValue(mockSimplifiedResult);

    const testBody = { text: "Legal document content text for testing caching." };

    // First call - should invoke Gemini
    const call1 = createMockReqRes(testBody);
    await simplifyHandler(call1.req, call1.res);

    expect(call1.getStatus()).toBe(200);
    expect(call1.getJson()).toEqual({
      data: mockSimplifiedResult,
      fallback: false,
    });
    expect(callGeminiSpy).toHaveBeenCalledTimes(1);

    // Second call with identical input - should return cached result without calling Gemini again
    const call2 = createMockReqRes(testBody);
    await simplifyHandler(call2.req, call2.res);

    expect(call2.getStatus()).toBe(200);
    expect(call2.getJson()).toEqual({
      data: mockSimplifiedResult,
      fallback: false,
    });
    expect(callGeminiSpy).toHaveBeenCalledTimes(1); // Still 1 call!
  });
});
