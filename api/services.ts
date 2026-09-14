import { z } from "zod";

const geminiResponse = z.object({
  candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }) })).min(1)
});

export async function generateJson<T>(prompt: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini is not configured");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
    }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Gemini request failed");
  const parsed = geminiResponse.parse(await response.json());
  const text = parsed.candidates[0].content.parts.map((part) => part.text ?? "").join("");
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Gemini is not configured");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Gemini request failed");
  const parsed = geminiResponse.parse(await response.json());
  return parsed.candidates[0].content.parts.map((part) => part.text ?? "").join("");
}

export async function ocrImage(base64: string, mimeType: string): Promise<string> {
  void mimeType;
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) throw new Error("Vision is not configured");
  const response = await fetch("https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ image: { content: base64 }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }] }] }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Vision request failed");
  const payload = await response.json() as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
  const text = payload.responses?.[0]?.fullTextAnnotation?.text;
  if (!text) throw new Error("No readable text found in image");
  return text;
}

export async function translateText(text: string, target: string): Promise<string> {
  const key = process.env.GOOGLE_CLOUD_API_KEY;
  if (!key) throw new Error("Translation is not configured");
  const response = await fetch("https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(key), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target, format: "text" }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Translation request failed");
  const payload = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
  const translated = payload.data?.translations?.[0]?.translatedText;
  if (!translated) throw new Error("Translation returned no text");
  return translated;
}
