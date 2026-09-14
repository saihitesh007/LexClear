import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { translateText } from "./services";

const input = z.object({ text: z.string().min(1).max(20_000), target: z.enum(["hi", "ta", "te", "bn", "mr"]) });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(input, req, res);
  if (!body) return;
  try {
    res.status(200).json({ data: await translateText(body.text, body.target) });
  } catch {
    res.status(200).json({ data: body.text, warning: "Translation is temporarily unavailable; showing the English version." });
  }
}
