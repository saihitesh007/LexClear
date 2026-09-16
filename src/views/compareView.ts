import type { ComparisonResult } from "../lib/gemini";

const significanceClass = {
  cosmetic: "border-slate-500 bg-slate-800/50",
  material: "border-amber-400 bg-amber-400/8",
  critical: "border-rose-400 bg-rose-400/8",
} as const;

export async function mountCompareView(
  host: HTMLElement,
  first: string,
  second: string
): Promise<void> {
  host.innerHTML = `
    <section class="mt-8 rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 sm:p-8">
      <p class="text-sm font-bold uppercase tracking-[.16em] text-teal-300">Version review</p>
      <h2 class="mt-2 text-3xl font-black text-white">Document comparison</h2>
      <p class="mt-2 text-slate-400">Review what changed before you agree to a new version.</p>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <article class="rounded-2xl border border-white/8 bg-slate-950/45 p-5">
          <h3 class="font-bold text-white">Document A</h3>
          <p class="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-300"></p>
        </article>
        <article class="rounded-2xl border border-white/8 bg-slate-950/45 p-5">
          <h3 class="font-bold text-white">Document B</h3>
          <p class="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-300"></p>
        </article>
      </div>
      <div id="compare-output" class="mt-7" role="status" aria-live="polite">Comparing documents…</div>
    </section>
  `;

  const previews = host.querySelectorAll<HTMLParagraphElement>("article p");
  if (previews[0]) previews[0].textContent = first;
  if (previews[1]) previews[1].textContent = second;

  const output = host.querySelector<HTMLElement>("#compare-output")!;

  try {
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ first, second }),
    });

    const payload = (await response.json()) as { data?: ComparisonResult };
    if (!response.ok || !payload.data) throw new Error();

    output.replaceChildren();

    const heading = document.createElement("h3");
    heading.className = "text-xl font-bold text-white";
    heading.textContent = "What changed";

    const summary = document.createElement("p");
    summary.className = "mt-2 leading-7 text-slate-300";
    summary.textContent = payload.data.summary;

    output.append(heading, summary);

    payload.data.differences.forEach((item) => {
      const card = document.createElement("article");
      card.className =
        "mt-4 rounded-xl border-l-4 p-5 " + significanceClass[item.significance];

      const label = document.createElement("strong");
      label.className = "text-white";
      label.textContent = item.significance.toUpperCase() + " · " + item.clause;

      const a = document.createElement("p");
      a.className = "mt-3 text-sm leading-6 text-slate-300";
      a.textContent = "Document A: " + item.docA;

      const b = document.createElement("p");
      b.className = "mt-2 text-sm leading-6 text-slate-300";
      b.textContent = "Document B: " + item.docB;

      card.append(label, a, b);
      output.append(card);
    });
  } catch {
    output.textContent =
      "Comparison is temporarily unavailable. Review the two originals side by side.";
  }
}