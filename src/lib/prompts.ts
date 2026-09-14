import { normalizeDocumentText } from "./document";

export function analysisPrompt(title: string, text: string): string {
  return "You are LexClear, a careful legal-information assistant. Do not give legal advice or invent facts. Analyze only the supplied document. Return valid JSON, no markdown, with title, summary, plainLanguage, keyDates (string[]), glossary ({term,meaning}[]), risks ({clause,level: low|medium|high,reason}[]). Explain terms in simple language and flag clauses worth asking a qualified lawyer about.\nTITLE: " + title + "\nDOCUMENT:\n" + normalizeDocumentText(text);
}

export function questionPrompt(documentText: string, question: string): string {
  return "Answer only from the document below. If it does not contain the answer, say that clearly. Use plain language, cite the relevant wording briefly, and add that this is legal information, not legal advice.\nDOCUMENT:\n" + normalizeDocumentText(documentText) + "\nQUESTION: " + question;
}

export function comparisonPrompt(first: string, second: string): string {
  return "Compare these two legal documents only using their text. Return valid JSON, no markdown: {summary:string, differences:{topic:string,first:string,second:string,importance:\"low\"|\"medium\"|\"high\"}[]}. Be concise and do not give legal advice.\nDOCUMENT A:\n" + normalizeDocumentText(first) + "\nDOCUMENT B:\n" + normalizeDocumentText(second);
}
