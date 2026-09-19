import type { VercelRequest, VercelResponse } from "@vercel/node";
import { simplifySchema } from "../src/lib/schemas";
import { callGeminiJson, simplifyWithFallback, type SimplifiedResult } from "../src/lib/gemini";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { RequestCache } from "./_cache";

export const simplifyCache = new RequestCache<{
  data: SimplifiedResult;
  fallback: boolean;
}>();

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(simplifySchema, req, res);
  if (!body) return;

  const key = RequestCache.hashKey(body.text);
  const cached = simplifyCache.get(key);
  if (cached) {
    res.status(200).json({ data: cached.data, fallback: cached.fallback });
    return;
  }

  const result = await simplifyWithFallback(body.text, async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Gemini is not configured");
    return callGeminiJson<SimplifiedResult>(prompt, apiKey);
  });

  if (!result.fallback) {
    simplifyCache.set(key, result);
  }

  res.status(200).json({ data: result.data, fallback: result.fallback });
}
