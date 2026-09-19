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

  it("compares two documents using Gemini", async () => {
    const mockComparisonResult: geminiModule.ComparisonResult = {
      summary: "Summary of changes",
      differences: [],
    };
    vi.spyOn(geminiModule, "callGeminiJson").mockResolvedValue(mockComparisonResult);

    const { req, res, getStatus, getJson } = createMockReqRes({
      first: "First document content text for comparison",
      second: "Second document content text for comparison",
    });

    await compareHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: mockComparisonResult,
      fallback: false,
    });
  });
});
