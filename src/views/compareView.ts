import type { ComparisonResult } from "../lib/gemini";

const significanceClass = { cosmetic: "border-slate-500", material: "border-amber-400", critical: "border-rose-400" } as const;
export async function mountCompareView(host: HTMLElement, first: string, second: string): Promise<void> {
  host.innerHTML = '<section class="mt-8 rounded-xl border border-slate-700 p-6"><h2 class="text-2xl font-bold">Document comparison</h2><div class="mt-4 grid gap-4 md:grid-cols-2"><article class="rounded-lg bg-slate-900 p-4"><h3 class="font-bold">Document A</h3><p class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm text-slate-300"></p></article><article class="rounded-lg bg-slate-900 p-4"><h3 class="font-bold">Document B</h3><p class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-sm text-slate-300"></p></article></div><div id="compare-output" class="mt-5" role="status" aria-live="polite">Comparing documents…</div></section>';
  const previews = host.querySelectorAll<HTMLParagraphElement>("article p"); previews[0].textContent = first; previews[1].textContent = second;
  const output = host.querySelector<HTMLElement>("#compare-output")!;
  try {
    const response = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ first, second }) });
    const payload = await response.json() as { data?: ComparisonResult };
    if (!response.ok || !payload.data) throw new Error();
    output.replaceChildren();
    const summary = document.createElement("p"); summary.className = "font-bold"; summary.textContent = payload.data.summary; output.append(summary);
    payload.data.differences.forEach((item) => { const card = document.createElement("article"); card.className = "mt-3 rounded border-l-4 p-4 " + significanceClass[item.significance]; const label = document.createElement("strong"); label.textContent = item.significance + " — " + item.clause; const a = document.createElement("p"); a.className = "mt-2 text-sm text-slate-300"; a.textContent = "Document A: " + item.docA; const b = document.createElement("p"); b.className = "mt-1 text-sm text-slate-300"; b.textContent = "Document B: " + item.docB; card.append(label, a, b); output.append(card); });
  } catch { output.textContent = "Comparison is temporarily unavailable. Review the two originals side by side."; }
}