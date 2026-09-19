import type { VercelRequest, VercelResponse } from "@vercel/node";
import { translate, translateWithFallback } from "../src/lib/translate";
import { translateSchema } from "../src/lib/schemas";
import { allowRequest, parseBody, postOnly } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(translateSchema, req, res);
  if (!body) return;

  const result = await translateWithFallback(body.texts, body.target, async (texts, target) => {
    const key = process.env.GOOGLE_TRANSLATE_KEY;
    if (!key) throw new Error("Translation is not configured");
    return translate(texts, target, key);
  });

  res.status(200).json({
    data: result.texts,
    fallback: result.fallback,
    warning: result.fallback ? "Translation is unavailable; showing English." : undefined,
  });
}
