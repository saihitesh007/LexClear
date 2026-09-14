import "./style.css";
import { wireUpload } from "./views/upload";
import type { Analysis } from "./lib/types";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing app");
app.innerHTML = '<main id="main-content" class="mx-auto max-w-4xl p-8"><h1 class="text-4xl font-black">LexClear</h1><p class="mt-2 text-slate-300">Upload a legal document for a plain-language review.</p><section class="mt-8 rounded-xl border border-slate-700 p-6"><label id="drop-zone" for="document-file" class="block cursor-pointer rounded-lg border-2 border-dashed border-slate-600 p-8 text-center">Drop PDF, DOCX, PNG, or JPG here</label><input id="document-file" class="sr-only" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"><p id="ingestion-status" class="mt-3" role="status" aria-live="polite"></p></section><section id="results" class="mt-8" hidden></section></main>';
const results = document.querySelector<HTMLElement>("#results")!;
wireUpload(document.querySelector<HTMLElement>("#drop-zone")!, document.querySelector<HTMLInputElement>("#document-file")!, document.querySelector<HTMLElement>("#ingestion-status")!, { onText: async (text) => {
  const response = await fetch("/api/simplify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Uploaded document", text }) });
  const payload = await response.json() as { data?: Analysis; error?: string };
  if (!response.ok || !payload.data) throw new Error(payload.error ?? "Simplification failed");
  results.hidden = false;
  results.innerHTML = '<h2 class="text-2xl font-bold">In plain language</h2><p class="mt-3 whitespace-pre-wrap leading-7">' + escapeHtml(payload.data.plainLanguage) + '</p>';
}});
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!); }