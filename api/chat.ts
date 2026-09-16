import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildChatPrompt, callGeminiJson } from "../src/lib/gemini";
import { chatSchema } from "../src/lib/schemas";
import { allowRequest, parseBody, postOnly } from "./_shared";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(chatSchema, req, res);
  if (!body) return;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured");
    const raw = await callGeminiJson<{ answer: string }>(buildChatPrompt(body.documentText, body.question, (body.history ?? [])), key);
    res.status(200).json({ data: raw.answer });
  } catch {
    res.status(200).json({ data: "Assistant unavailable. Please review the document directly; this is general information, not legal advice.", fallback: true });
  }
}