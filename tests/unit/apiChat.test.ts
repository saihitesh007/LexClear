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

  it("answers question using Gemini when key is present", async () => {
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
    expect(getJson()).toEqual({ data: "Answer text" });
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
