import type { VercelRequest, VercelResponse } from "@vercel/node";
import { simplifySchema } from "../src/lib/schemas";
import { callGeminiJson, simplifyWithFallback, type SimplifiedResult } from "../src/lib/gemini";
import { allowRequest, parseBody, postOnly } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(simplifySchema, req, res);
  if (!body) return;
  const result = await simplifyWithFallback(body.text, async (prompt) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured");
    return callGeminiJson<SimplifiedResult>(prompt, key);
  });
  res.status(200).json({ data: result.data, fallback: result.fallback });
}