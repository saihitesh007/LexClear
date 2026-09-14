import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { fallbackAnalysis, normalizeDocumentText } from "../src/lib/document";
import { analysisPrompt } from "../src/lib/prompts";
import type { Analysis } from "../src/lib/types";
import { allowRequest, parseBody, postOnly } from "./_shared";
import { generateJson, ocrImage } from "./services";

const input = z.object({
  title: z.string().trim().max(120).default("Uploaded document"),
  text: z.string().max(60_000).optional(),
  imageBase64: z.string().max(5_500_000).optional(),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).optional()
}).refine((data) => Boolean(data.text || data.imageBase64), { message: "Document text or image is required" });

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;
  const body = parseBody(input, req, res);
  if (!body) return;
  let extractedText = body.text ?? "";
  try {
    const title = body.title ?? "Uploaded document";
    extractedText = normalizeDocumentText(body.text || await ocrImage(body.imageBase64!, body.mimeType!));
    const result = await generateJson<Omit<Analysis, "source">>(analysisPrompt(title, extractedText));
    res.status(200).json({ data: { ...result, source: "gemini" }, extractedWith: body.imageBase64 ? "vision" : "text" });
  } catch {
    const fallback = fallbackAnalysis(body.title ?? "Uploaded document", extractedText);
    res.status(200).json({ data: fallback, warning: "AI processing is temporarily unavailable; showing a local document review." });
  }
}
