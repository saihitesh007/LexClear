export interface SimplifiedResult {
  simplifiedText: string;
  keyPoints: string[];
  caveats: string[];
  glossary?: Array<{ term: string; definition: string }>;
}

// Enforces source-only simplification and a machine-readable response contract.
export function buildSimplifyPrompt(documentText: string): string {
  return `You are LexClear, a careful legal-information assistant. Rewrite ONLY the supplied document in plain language at approximately an 8th-grade reading level. Preserve every legal obligation, deadline, condition, and monetary figure exactly. Never invent a clause, fact, or interpretation not supported by the source. If any wording is ambiguous or damaged, describe the uncertainty in caveats rather than guessing. Return valid JSON only, with exactly this shape: {"simplifiedText":"string","keyPoints":["string"],"caveats":["string"],"glossary":[{"term":"string","definition":"string"}]}.

SOURCE DOCUMENT:
${documentText}`;
}

export async function callGeminiJson<T>(prompt: string, apiKey: string): Promise<T> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const keyPoints = sentences
    .filter((sentence) => /\b(shall|must|may not|pay|fee|renew|terminat|deadline|within|indemn|liability)\b/i.test(sentence))
    .slice(0, 6)
    .map((sentence) => sentence.trim());

  return {
    simplifiedText: sentences.slice(0, 8).join(" ").trim() || "We could not extract enough readable text to simplify this document.",
    keyPoints: keyPoints.length ? keyPoints : sentences.slice(0, 3).map((sentence) => sentence.trim()),
    caveats: ["AI simplification is temporarily unavailable; this is a sentence-level fallback. Review the original document carefully."],
    glossary: []
  };
}

export async function simplifyWithFallback(
  documentText: string,
  invoke: (prompt: string) => Promise<SimplifiedResult>
): Promise<{ data: SimplifiedResult; fallback: boolean }> {
  try {
    return { data: await invoke(buildSimplifyPrompt(documentText)), fallback: false };
  } catch {
    return { data: heuristicSimplification(documentText), fallback: true };
  }
}

export interface ComparisonResult {
  summary: string;
  differences: Array<{ clause: string; docA: string; docB: string; significance: "cosmetic" | "material" | "critical" }>;
}

// Constrains comparison output to source-backed, significance-tagged differences.
export function buildComparePrompt(textA: string, textB: string): string {
  return `Compare ONLY these two legal documents. Return valid JSON only: {"summary":"string","differences":[{"clause":"string","docA":"string","docB":"string","significance":"cosmetic|material|critical"}]}. Never invent differences; mark a difference critical only when it changes a material obligation, deadline, remedy, liability, or money.
DOCUMENT A:
${textA}
DOCUMENT B:
${textB}`;
}

export async function compareWithFallback(
  textA: string,
  textB: string,
  invoke: (prompt: string) => Promise<ComparisonResult>
): Promise<{ data: ComparisonResult; fallback: boolean }> {
  try {
    return { data: await invoke(buildComparePrompt(textA, textB)), fallback: false };
  } catch {
    return { data: { summary: "Comparison service is temporarily unavailable. Review the two originals side by side.", differences: [] }, fallback: true };
  }
}

// Prevents outside legal knowledge from entering document-grounded answers.
export function buildChatPrompt(
  documentText: string,
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): string {
  return `Answer ONLY from the provided document. If the answer is absent, say exactly: this isn't covered in the document. Do not use outside legal knowledge. This is general information, not legal advice.
DOCUMENT:
${documentText}
HISTORY:
${history.map((message) => message.role + ": " + message.content).join("\n")}
QUESTION: ${question}`;
}