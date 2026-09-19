import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildChatPrompt, callGeminiJson } from "../src/lib/gemini";
import { chatSchema } from "../src/lib/schemas";
import { RequestCache } from "./_cache";
import { allowRequest, parseBody, postOnly } from "./_shared";

const docCache = new RequestCache<string>(50, 10 * 60 * 1000);

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(chatSchema, req, res);
  if (!body) return;

  let documentText = body.documentText;
  let documentHash = body.documentHash;

  if (documentText) {
    if (!documentHash) {
      documentHash = RequestCache.hashKey(documentText);
    }
    docCache.set(documentHash, documentText);
  } else if (documentHash) {
    const cached = docCache.get(documentHash);
    if (!cached) {
      res
        .status(400)
        .json({ error: "Document not found in cache. Resend full documentText.", cacheMiss: true });
      return;
    }
    documentText = cached;
  }

  if (!documentText) {
    res.status(400).json({ error: "Missing document text or valid hash.", cacheMiss: true });
    return;
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured");
    const raw = await callGeminiJson<{ answer: string }>(
      buildChatPrompt(documentText, body.question, body.history ?? []),
      key
    );
    res.status(200).json({ data: raw.answer, documentHash });
  } catch {
    res.status(200).json({
      data: "Assistant unavailable. Please review the document directly; this is general information, not legal advice.",
      fallback: true,
    });
  }
}
