import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseDocument } from "../src/lib/parseDocument";
import { ocrSchema } from "../src/lib/schemas";
import { runVisionOcr } from "../src/lib/vision";
import { allowRequest, parseBody, postOnly } from "./_shared";

const MAX_BASE64_LENGTH = 14_000_000;
const MAX_CONTENT_LENGTH = 15_000_000;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!postOnly(req, res) || !allowRequest(req, res)) return;

  const contentLengthHeader = req.headers["content-length"];
  if (contentLengthHeader) {
    const contentLength = parseInt(
      Array.isArray(contentLengthHeader)
        ? contentLengthHeader[0]
        : contentLengthHeader,
      10
    );
    if (!isNaN(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
      res.status(400).json({ error: "File must be 10 MB or smaller." });
      return;
    }
  }

  const body = parseBody(ocrSchema, req, res);
  if (!body) return;

  if (body.imageBase64.length > MAX_BASE64_LENGTH) {
    res.status(400).json({ error: "File must be 10 MB or smaller." });
    return;
  }

  try {
    const buffer = Buffer.from(body.imageBase64, "base64");
    if (buffer.byteLength > 10_000_000) {
      res.status(400).json({ error: "File must be 10 MB or smaller." });
      return;
    }
    const parsed = await parseDocument(buffer, body.mimeType);

    if (parsed.text) {
      res.status(200).json({ data: { text: parsed.text, ocrUsed: false } });
      return;
    }
    const key = process.env.GOOGLE_CLOUD_VISION_KEY;
    if (!key) throw new Error("OCR unavailable");
    const text = await runVisionOcr(body.imageBase64, key);
    if (!text.trim()) throw new Error("No text found");
    res.status(200).json({ data: { text, ocrUsed: true } });
  } catch {
    res
      .status(422)
      .json({ error: "Couldn't read this document — try a clearer scan." });
  }
}
