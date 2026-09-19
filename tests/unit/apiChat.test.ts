import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import chatHandler from "../../api/chat";
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

describe("api/chat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GEMINI_API_KEY = "test-key";
  });

  it("answers question using Gemini and caches document text on first request", async () => {
    vi.spyOn(geminiModule, "callGeminiJson").mockResolvedValue({
      answer: "Answer text",
    });

    const { req, res, getStatus, getJson } = createMockReqRes({
      documentText: "Legal document content text for grounded question answering.",
      question: "When does the lease terminate?",
      history: [],
    });

    await chatHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual(
      expect.objectContaining({
        data: "Answer text",
        documentHash: expect.any(String) as unknown,
      })
    );
  });

  it("allows subsequent question using documentHash without resending full documentText", async () => {
    vi.spyOn(geminiModule, "callGeminiJson").mockResolvedValue({
      answer: "First answer",
    });

    const documentText = "Unique legal document text for caching test 12345.";

    const firstReq = createMockReqRes({
      documentText,
      documentHash: "hash-12345",
      question: "First question?",
      history: [],
    });

    await chatHandler(firstReq.req, firstReq.res);
    expect(firstReq.getStatus()).toBe(200);

    vi.spyOn(geminiModule, "callGeminiJson").mockResolvedValue({
      answer: "Second answer from cached document",
    });

    const secondReq = createMockReqRes({
      documentHash: "hash-12345",
      question: "Second question without text?",
      history: [],
    });

    await chatHandler(secondReq.req, secondReq.res);

    expect(secondReq.getStatus()).toBe(200);
    expect(secondReq.getJson()).toEqual({
      data: "Second answer from cached document",
      documentHash: "hash-12345",
    });

    expect(geminiModule.callGeminiJson).toHaveBeenCalledWith(
      expect.stringContaining("Unique legal document text for caching test 12345."),
      "test-key"
    );
  });

  it("returns cacheMiss error when documentHash is not found in server cache", async () => {
    const { req, res, getStatus, getJson } = createMockReqRes({
      documentHash: "non-existent-hash",
      question: "Is this cached?",
      history: [],
    });

    await chatHandler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({
      error: "Document not found in cache. Resend full documentText.",
      cacheMiss: true,
    });
  });

  it("returns fallback message when Gemini key is missing or fails", async () => {
    delete process.env.GEMINI_API_KEY;

    const { req, res, getStatus, getJson } = createMockReqRes({
      documentText: "Legal document content text for grounded question answering.",
      question: "When does the lease terminate?",
      history: [],
    });

    await chatHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: "Assistant unavailable. Please review the document directly; this is general information, not legal advice.",
      fallback: true,
    });
  });
});
