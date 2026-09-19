import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import translateHandler from "../../api/translate";
import * as translateModule from "../../src/lib/translate";

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

describe("api/translate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_TRANSLATE_KEY = "test-translate-key";
  });

  it("translates text using translate function", async () => {
    vi.spyOn(translateModule, "translate").mockResolvedValue(["Translated text"]);

    const { req, res, getStatus, getJson } = createMockReqRes({
      texts: ["English text to translate"],
      target: "hi",
    });

    await translateHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: ["Translated text"],
      fallback: false,
      warning: undefined,
    });
  });

  it("returns fallback response when key is missing or translation fails", async () => {
    delete process.env.GOOGLE_TRANSLATE_KEY;

    const { req, res, getStatus, getJson } = createMockReqRes({
      texts: ["English text to translate"],
      target: "hi",
    });

    await translateHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: ["English text to translate"],
      fallback: true,
      warning: "Translation is unavailable; showing English.",
    });
  });
});
