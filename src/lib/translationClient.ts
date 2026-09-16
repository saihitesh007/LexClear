import type { SimplifiedResult } from "./gemini";

type Glossary = NonNullable<SimplifiedResult["glossary"]>;
interface TranslationResponse {
  text: string;
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

async function translateText(text: string, target: string): Promise<TranslationResponse> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target }),
    });
    const payload = (await response.json()) as { data?: string; fallback?: boolean };
    return {
      text: payload.data ?? text,
      fallback: !response.ok || payload.fallback === true || !payload.data,
    };
  } catch {
    return { text, fallback: true };
  }
}

export async function translateResult(
  result: SimplifiedResult,
  target: string
): Promise<TranslatedResult> {
  // Each request has its own fallback, so these independent calls can run together safely.
  const glossaryTask = Promise.all(
    (result.glossary ?? []).map(async (item) => ({
      term: item.term,
      definition: await translateText(item.definition, target),
    }))
  );
  const summaryTask = translateText(result.simplifiedText, target);
  const keyPointsTask = Promise.all(result.keyPoints.map((item) => translateText(item, target)));
  const caveatsTask = Promise.all(result.caveats.map((item) => translateText(item, target)));
  const [glossaryResults, summary, keyPoints, caveats] = await Promise.all([
    glossaryTask,
    summaryTask,
    keyPointsTask,
    caveatsTask,
  ]);
  const responses = [
    summary,
    ...keyPoints,
    ...caveats,
    ...glossaryResults.map((item) => item.definition),
  ];
  const glossary: Glossary = glossaryResults.map((item) => ({
    term: item.term,
    definition: item.definition.text,
  }));

  return {
    data: {
      ...result,
      simplifiedText: summary.text,
      keyPoints: keyPoints.map((item) => item.text),
      caveats: caveats.map((item) => item.text),
      glossary,
    },
    fallback: responses.some((item) => item.fallback),
  };
}
