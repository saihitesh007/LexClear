export async function translate(text: string, targetLang: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLang, format: "text" }),
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!response.ok) throw new Error("Translation request failed");

  const body = (await response.json()) as {
    data?: { translations?: Array<{ translatedText?: string }> };
  };
  return body.data?.translations?.[0]?.translatedText ?? text;
}

export async function translateWithFallback(
  text: string,
  targetLang: string,
  invoke: (text: string, target: string) => Promise<string>
): Promise<{ text: string; fallback: boolean }> {
  try {
    return { text: await invoke(text, targetLang), fallback: false };
  } catch {
    return { text, fallback: true };
  }
}
