import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { questionPrompt } from "../src/lib/prompts";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { generateText } from "./services";

const input = z.object({ documentText: z.string().min(20).max(60_000), question: z.string().trim().min(3).max(500) });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(input, req, res);
  if (!body) return;
  try {
    res.status(200).json({ data: await generateText(questionPrompt(body.documentText, body.question)) });
  } catch {
    res.status(200).json({ data: "I cannot reach the document assistant right now. Please review the original document or ask a qualified lawyer. This is legal information, not legal advice.", fallback: true });
  }
}
