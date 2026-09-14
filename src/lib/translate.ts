export async function runTranslation(text: string, target: string, apiKey: string): Promise<string> {
  const response = await fetch("https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(apiKey), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: text, target, format: "text" }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error("Translation request failed");
  const body = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
  return body.data?.translations?.[0]?.translatedText ?? text;
}
