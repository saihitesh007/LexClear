import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import compareHandler, { compareCache } from "../../api/compare";
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

  return { req, res, getStatus: () => statusCode, getJson: () => jsonBody };
}

describe("api/compare", () => {
  beforeEach(() => {
    compareCache.clear();
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("compares two documents using Gemini and returns cached result on second call", async () => {
    const mockComparisonResult: geminiModule.ComparisonResult = {
      summary: "Summary of changes",
      differences: [],
    };
    const spy = vi.spyOn(geminiModule, "callGeminiJson").mockResolvedValue(mockComparisonResult);

    const testBody = {
      first: "First document content text for comparison",
      second: "Second document content text for comparison",
    };

    const call1 = createMockReqRes(testBody);
    await compareHandler(call1.req, call1.res);

    expect(call1.getStatus()).toBe(200);
    expect(call1.getJson()).toEqual({
      data: mockComparisonResult,
      fallback: false,
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Second call - should hit cache
    const call2 = createMockReqRes(testBody);
    await compareHandler(call2.req, call2.res);

    expect(call2.getStatus()).toBe(200);
    expect(call2.getJson()).toEqual({
      data: mockComparisonResult,
      fallback: false,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("returns fallback response when Gemini key is missing or call throws", async () => {
    delete process.env.GEMINI_API_KEY;

    const { req, res, getStatus, getJson } = createMockReqRes({
      first: "First document content text for comparison",
      second: "Second document content text for comparison",
    });

    await compareHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: expect.objectContaining({
        summary: expect.stringContaining("Comparison service is temporarily unavailable") as unknown,
        differences: [],
      }) as unknown,
      fallback: true,
    });
  });
});
