import { analysisPrompt, comparisonPrompt, questionPrompt } from "./prompts";
export { analysisPrompt, comparisonPrompt, questionPrompt };
/** Server-only. Do not import from browser entry points. */
export async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Gemini request failed");
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
}
