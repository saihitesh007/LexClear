import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { comparisonPrompt } from "../src/lib/prompts";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { generateJson } from "./services";

const input = z.object({ first: z.string().min(20).max(60_000), second: z.string().min(20).max(60_000) });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(input, req, res);
  if (!body) return;
  try {
    res.status(200).json({ data: await generateJson<unknown>(comparisonPrompt(body.first, body.second)) });
  } catch {
    res.status(200).json({ data: { summary: "Comparison is temporarily unavailable.", differences: [] }, fallback: true });
  }
}
