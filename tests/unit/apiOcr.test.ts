import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import ocrHandler from "../../api/ocr";
import * as parseDocModule from "../../src/lib/parseDocument";
import * as visionModule from "../../src/lib/vision";

function createMockReqRes(body: unknown, headers: Record<string, string> = {}) {
  const req = {
    method: "POST",
    headers: { "x-forwarded-for": "127.0.0.1", ...headers },
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

describe("api/ocr", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GOOGLE_CLOUD_VISION_KEY = "test-vision-key";
  });

  it("parses document text successfully without OCR", async () => {
    vi.spyOn(parseDocModule, "parseDocument").mockResolvedValue({
      text: "Parsed document text",
    });

    const { req, res, getStatus, getJson } = createMockReqRes({
      title: "test.pdf",
      imageBase64: Buffer.from("test").toString("base64"),
      mimeType: "application/pdf",
    });

    await ocrHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: { text: "Parsed document text", ocrUsed: false },
    });
  });

  it("runs Vision OCR when document text is empty", async () => {
    vi.spyOn(parseDocModule, "parseDocument").mockResolvedValue({ text: "" });
    vi.spyOn(visionModule, "runVisionOcr").mockResolvedValue("OCR recognized text");

    const { req, res, getStatus, getJson } = createMockReqRes({
      title: "scanned.png",
      imageBase64: Buffer.from("image").toString("base64"),
      mimeType: "image/png",
    });

    await ocrHandler(req, res);

    expect(getStatus()).toBe(200);
    expect(getJson()).toEqual({
      data: { text: "OCR recognized text", ocrUsed: true },
    });
  });

  it("rejects early with 400 when Content-Length header exceeds limit", async () => {
    const { req, res, getStatus, getJson } = createMockReqRes(
      {
        title: "big.pdf",
        imageBase64: "a",
        mimeType: "application/pdf",
      },
      { "content-length": "20000000" }
    );

    await ocrHandler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({ error: "File must be 10 MB or smaller." });
  });

  it("rejects early with 400 when base64 string exceeds length limit", async () => {
    const hugeBase64 = "a".repeat(15_000_000);
    const { req, res, getStatus, getJson } = createMockReqRes({
      title: "huge.pdf",
      imageBase64: hugeBase64,
      mimeType: "application/pdf",
    });

    await ocrHandler(req, res);

    expect(getStatus()).toBe(400);
    expect(getJson()).toEqual({
      error: "String must contain at most 14000000 character(s)",
    });
  });

  it("returns 422 when processing fails", async () => {
    vi.spyOn(parseDocModule, "parseDocument").mockRejectedValue(
      new Error("Parse failure")
    );

    const { req, res, getStatus, getJson } = createMockReqRes({
      title: "corrupt.pdf",
      imageBase64: Buffer.from("bad").toString("base64"),
      mimeType: "application/pdf",
    });

    await ocrHandler(req, res);

    expect(getStatus()).toBe(422);
    expect(getJson()).toEqual({
      error: "Couldn't read this document — try a clearer scan.",
    });
  });
});
