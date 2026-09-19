import type { SimplifiedResult } from "./gemini";

type Glossary = NonNullable<SimplifiedResult["glossary"]>;

interface TranslationResponse {
  texts: string[];
  fallback: boolean;
}

export interface TranslatedResult {
  data: SimplifiedResult;
  fallback: boolean;
}

const translationCache = new Map<string, TranslatedResult>();

export function getCachedTranslation(
  target: string,
  sourceText: string
): TranslatedResult | undefined {
  return translationCache.get(target + ":" + sourceText);
}

export function cacheTranslation(
  target: string,
  sourceText: string,
  translated: TranslatedResult
): void {
  translationCache.set(target + ":" + sourceText, translated);
}

async function translateTexts(texts: string[], target: string): Promise<TranslationResponse> {
  if (texts.length === 0) {
    return { texts: [], fallback: false };
  }
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, target }),
    });
    const payload = (await response.json()) as {
      data?: string[];
      fallback?: boolean;
    };
    return {
      texts: payload.data ?? texts,
      fallback: !response.ok || payload.fallback === true || !payload.data,
    };
  } catch {
    return { texts, fallback: true };
  }
}

export async function translateResult(
  result: SimplifiedResult,
  target: string
): Promise<TranslatedResult> {
  const glossary = result.glossary ?? [];
  const allTexts: string[] = [
    result.simplifiedText,
    ...result.keyPoints,
    ...result.caveats,
    ...glossary.map((item) => item.definition),
  ];

  const translationRes = await translateTexts(allTexts, target);
  const translatedTexts = translationRes.texts;
  const fallback = translationRes.fallback;

  let cursor = 0;
  const simplifiedText = translatedTexts[cursor++] ?? result.simplifiedText;

  const keyPoints = result.keyPoints.map((original, i) => translatedTexts[cursor + i] ?? original);
  cursor += result.keyPoints.length;

  const caveats = result.caveats.map((original, i) => translatedTexts[cursor + i] ?? original);
  cursor += result.caveats.length;

  const translatedGlossary: Glossary = glossary.map((item, i) => ({
    term: item.term,
    definition: translatedTexts[cursor + i] ?? item.definition,
  }));

  return {
    data: {
      ...result,
      simplifiedText,
      keyPoints,
      caveats,
      glossary: translatedGlossary,
    },
    fallback,
  };
}
