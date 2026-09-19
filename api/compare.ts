import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callGeminiJson, compareWithFallback, type ComparisonResult } from "../src/lib/gemini";
import { compareSchema } from "../src/lib/schemas";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { RequestCache } from "./_cache";

export const compareCache = new RequestCache<{
  data: ComparisonResult;
  fallback: boolean;
}>();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(compareSchema, req, res);
  if (!body) return;

  const key = RequestCache.hashKey(body.first, body.second);
  const cached = compareCache.get(key);
  if (cached) {
    res.status(200).json({ data: cached.data, fallback: cached.fallback });
    return;
  }

  const result = await compareWithFallback(body.first, body.second, async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini is not configured");
    return callGeminiJson<ComparisonResult>(prompt, apiKey);
  });

  if (!result.fallback) {
    compareCache.set(key, result);
  }

  res.status(200).json({ data: result.data, fallback: result.fallback });
}
