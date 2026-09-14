import type { Analysis, RiskFlag, RiskLevel } from "./types";

const RISK_PATTERNS: Array<{ pattern: RegExp; level: RiskLevel; label: string; reason: string }> = [
  { pattern: /indemnif(y|ication)/i, level: "high", label: "Indemnity", reason: "May make you cover another party's losses or legal costs." },
  { pattern: /personal guarantee|guarantor/i, level: "high", label: "Personal guarantee", reason: "Can create personal liability beyond the agreement." },
  { pattern: /auto(?:matic)? renewal|automatically renew/i, level: "medium", label: "Automatic renewal", reason: "The agreement may continue unless cancelled on time." },
  { pattern: /arbitration|waive.*jury/i, level: "medium", label: "Dispute resolution", reason: "May limit where or how you can resolve a dispute." },
  { pattern: /terminate|termination/i, level: "medium", label: "Termination", reason: "Review notice periods and what happens after ending the agreement." },
  { pattern: /penalt(y|ies)|late fee|liquidated damages/i, level: "medium", label: "Penalty or fee", reason: "Could impose extra costs if a condition is missed." }
];

export function normalizeDocumentText(input: string): string {
  return input.replace(/\u0000/g, "").replace(/\s+/g, " ").trim().slice(0, 60_000);
}

export function splitClauses(text: string): string[] {
  return normalizeDocumentText(text).split(/(?<=[.;])\s+(?=[A-Z0-9])/).filter((part) => part.length > 20);
}

export function scoreRisks(text: string): RiskFlag[] {
  const clauses = splitClauses(text);
  const flags: RiskFlag[] = [];
  for (const rule of RISK_PATTERNS) {
    const clause = clauses.find((item) => rule.pattern.test(item));
    if (clause) flags.push({ clause: rule.label + ": " + clause.slice(0, 220), level: rule.level, reason: rule.reason });
  }
  return flags;
}

export function fallbackAnalysis(title: string, text: string): Analysis {
  const clean = normalizeDocumentText(text);
  const sentences = splitClauses(clean);
  return {
    title: title || "Uploaded document",
    summary: clean ? "This document contains " + (sentences.length || 1) + " readable sections. Review the highlighted commitments before signing." : "We could not read text from this document.",
    plainLanguage: sentences.slice(0, 4).join(" ") || "Upload a text-based document or a clear image for a plain-language overview.",
    keyDates: extractDates(clean),
    glossary: extractGlossary(clean),
    risks: scoreRisks(clean),
    source: "fallback"
  };
}

export function extractDates(text: string): string[] {
  const matches = text.match(/\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? \d{4})\b/gi) ?? [];
  return [...new Set(matches)].slice(0, 6);
}

function extractGlossary(text: string): Array<{ term: string; meaning: string }> {
  const known = [
    ["indemnity", "A promise to compensate someone for certain losses."],
    ["jurisdiction", "The court system or place whose laws apply."],
    ["force majeure", "An exceptional event that may excuse a delay or failure to perform."],
    ["confidential", "Information that must be kept private under the agreement."]
  ] as const;
  return known.filter(([term]) => new RegExp(term, "i").test(text)).map(([term, meaning]) => ({ term, meaning }));
}
