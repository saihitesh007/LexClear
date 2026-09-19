import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import simplifyHandler, { simplifyCache } from "../../api/simplify";
import { RequestCache } from "../../api/_cache";
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

describe("request-level caching (simplify handler)", () => {
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

    const call1 = createMockReqRes(testBody);
    await simplifyHandler(call1.req, call1.res);

    expect(call1.getStatus()).toBe(200);
    expect(call1.getJson()).toEqual({ data: mockSimplifiedResult, fallback: false });
    expect(callGeminiSpy).toHaveBeenCalledTimes(1);

    const call2 = createMockReqRes(testBody);
    await simplifyHandler(call2.req, call2.res);

    expect(call2.getStatus()).toBe(200);
    expect(call2.getJson()).toEqual({ data: mockSimplifiedResult, fallback: false });
    expect(callGeminiSpy).toHaveBeenCalledTimes(1);
  });

  it("returns fallback when Gemini key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const { req, res, getStatus, getJson } = createMockReqRes({
      text: "Legal document content text for fallback branch test.",
    });

    await simplifyHandler(req, res);

    expect(getStatus()).toBe(200);
    const body = getJson() as { data: geminiModule.SimplifiedResult; fallback: boolean };
    expect(body.fallback).toBe(true);
    expect(body.data.caveats[0]).toContain("temporarily unavailable");
  });
});

describe("RequestCache eviction and TTL expiry", () => {
  it("evicts the oldest entry when maxEntries is exceeded", () => {
    const cache = new RequestCache<string>(2, 60_000);
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3"); // Should evict key1

    expect(cache.get("key1")).toBeUndefined(); // Evicted
    expect(cache.get("key2")).toBe("value2");
    expect(cache.get("key3")).toBe("value3");
  });

  it("returns undefined and removes an entry after TTL has expired", () => {
    const cache = new RequestCache<string>(50, 1); // 1ms TTL
    cache.set("expiring-key", "some-value");

    // Wait for TTL to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cache.get("expiring-key")).toBeUndefined();
        resolve();
      }, 10);
    });
  });
});
