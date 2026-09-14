export type RiskLevel = "low" | "medium" | "high";

export interface RiskFlag {
  clause: string;
  level: RiskLevel;
  reason: string;
}

export interface Analysis {
  title: string;
  summary: string;
  plainLanguage: string;
  keyDates: string[];
  glossary: Array<{ term: string; meaning: string }>;
  risks: RiskFlag[];
  source: "gemini" | "fallback";
}

export interface ApiResult<T> {
  data?: T;
  error?: string;
}
