export async function translate(
  texts: string[],
  targetLang: string,
  apiKey: string
): Promise<string[]> {
  if (texts.length === 0) return [];
  const response = await fetch(
    "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, target: targetLang, format: "text" }),
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!response.ok) throw new Error("Translation request failed");

  const body = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  const translations = body.data?.translations;
  if (!translations || translations.length !== texts.length) {
    throw new Error("Invalid translation response");
  }
  return translations.map((item, index) => item.translatedText ?? texts[index]);
}

export async function translateWithFallback(
  texts: string[],
  targetLang: string,
  invoke: (texts: string[], target: string) => Promise<string[]>
): Promise<{ texts: string[]; fallback: boolean }> {
  try {
    return { texts: await invoke(texts, targetLang), fallback: false };
  } catch {
    return { texts, fallback: true };
  }
}
