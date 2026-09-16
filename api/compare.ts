import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callGeminiJson, compareWithFallback, type ComparisonResult } from "../src/lib/gemini";
import { compareSchema } from "../src/lib/schemas";
import { allowRequest, parseBody, postOnly } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(compareSchema, req, res);
  if (!body) return;

  const result = await compareWithFallback(body.first, body.second, async (prompt) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured");
    return callGeminiJson<ComparisonResult>(prompt, key);
  });

  res.status(200).json({ data: result.data, fallback: result.fallback });
}