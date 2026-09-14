export interface SimplifiedResult { simplifiedText: string; keyPoints: string[]; caveats: string[]; }

export function buildSimplifyPrompt(documentText: string): string {
  return `You are LexClear, a careful legal-information assistant. Rewrite ONLY the supplied document in plain language at approximately an 8th-grade reading level. Preserve every legal obligation, deadline, condition, and monetary figure exactly. Never invent a clause, fact, or interpretation not supported by the source. If any wording is ambiguous or damaged, describe the uncertainty in caveats rather than guessing. Return valid JSON only, with exactly this shape: {"simplifiedText":"string","keyPoints":["string"],"caveats":["string"]}.\n\nSOURCE DOCUMENT:\n${documentText}`;
}

export async function callGeminiJson<T>(prompt: string, apiKey: string): Promise<T> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.15 } }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) throw new Error("Gemini request failed");
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini returned no content");
  return JSON.parse(text) as T;
}

export function heuristicSimplification(documentText: string): SimplifiedResult {
  const sentences = documentText.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [];
  const keyPoints = sentences.filter((sentence) => /\b(shall|must|may not|pay|fee|renew|terminat|deadline|within|indemn|liability)\b/i.test(sentence)).slice(0, 6).map((sentence) => sentence.trim());
  return { simplifiedText: sentences.slice(0, 8).join(" ").trim() || "We could not extract enough readable text to simplify this document.", keyPoints: keyPoints.length ? keyPoints : sentences.slice(0, 3).map((sentence) => sentence.trim()), caveats: ["AI simplification is temporarily unavailable; this is a sentence-level fallback. Review the original document carefully."] };
}

export async function simplifyWithFallback(documentText: string, invoke: (prompt: string) => Promise<SimplifiedResult>): Promise<{ data: SimplifiedResult; fallback: boolean }> {
  try { return { data: await invoke(buildSimplifyPrompt(documentText)), fallback: false }; }
  catch { return { data: heuristicSimplification(documentText), fallback: true }; }
}