import { describe, it, expect } from "vitest";
import { z } from "zod";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { allowRequest, postOnly, parseBody } from "../../api/_shared";

function createMockReqRes(options: {
  method?: string;
  headers?: Record<string, string | string[]>;
  body?: unknown;
} = {}) {
  const req = {
    method: options.method ?? "POST",
    headers: options.headers ?? {},
    body: options.body ?? {},
  } as unknown as VercelRequest;

  let statusCode = 200;
  let jsonBody: unknown = null;
  const headersSet: Record<string, string> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return res;
    },
    setHeader(key: string, val: string) {
      headersSet[key] = val;
      return res;
    },
  } as unknown as VercelResponse;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    getHeaders: () => headersSet,
  };
}

describe("api/_shared", () => {
  describe("allowRequest", () => {
    it("allows requests under the rate limit", () => {
      const { req, res } = createMockReqRes({
        headers: { "x-forwarded-for": "192.168.1.100" },
      });
      const allowed = allowRequest(req, res);
      expect(allowed).toBe(true);
    });

    it("blocks requests exceeding the rate limit (15 requests)", () => {
      const ip = "10.0.0.1";
      for (let i = 0; i < 15; i++) {
        const { req, res } = createMockReqRes({
          headers: { "x-forwarded-for": ip },
        });
        expect(allowRequest(req, res)).toBe(true);
      }
      // 16th request should fail
      const { req, res, getStatus, getJson } = createMockReqRes({
        headers: { "x-forwarded-for": ip },
      });
      expect(allowRequest(req, res)).toBe(false);
      expect(getStatus()).toBe(429);
      expect(getJson()).toEqual({
        error: "Too many requests. Please wait a minute and try again.",
      });
    });

    it("handles missing x-forwarded-for header gracefully", () => {
      const { req, res } = createMockReqRes({ headers: {} });
      const allowed = allowRequest(req, res);
      expect(typeof allowed).toBe("boolean");
    });
  });

  describe("postOnly", () => {
    it("returns true for POST method", () => {
      const { req, res } = createMockReqRes({ method: "POST" });
      expect(postOnly(req, res)).toBe(true);
    });

    it("returns false and sets 405 status for GET method", () => {
      const { req, res, getStatus, getJson, getHeaders } = createMockReqRes({
        method: "GET",
      });
      expect(postOnly(req, res)).toBe(false);
      expect(getStatus()).toBe(405);
      expect(getHeaders()["Allow"]).toBe("POST");
      expect(getJson()).toEqual({ error: "Method not allowed" });
    });
  });

  describe("parseBody", () => {
    const testSchema = z.object({
      title: z.string(),
      count: z.number(),
    });

    it("parses valid body correctly", () => {
      const validBody = { title: "Test Doc", count: 5 };
      const { req, res } = createMockReqRes({ body: validBody });
      const parsed = parseBody(testSchema, req, res);
      expect(parsed).toEqual(validBody);
    });

    it("returns null and sets 400 status on invalid body", () => {
      const invalidBody = { title: "Test Doc", count: "invalid" };
      const { req, res, getStatus, getJson } = createMockReqRes({
        body: invalidBody,
      });
      const parsed = parseBody(testSchema, req, res);
      expect(parsed).toBeNull();
      expect(getStatus()).toBe(400);
      expect(getJson()).toHaveProperty("error");
    });
  });
});
