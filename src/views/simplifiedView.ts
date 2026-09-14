import type { SimplifiedResult } from "../lib/gemini";

export function renderSimplifiedView(container: HTMLElement, data: SimplifiedResult): void {
  container.hidden = false;
  container.replaceChildren();
  const heading = document.createElement("h2"); heading.className = "text-2xl font-bold"; heading.textContent = "In plain language";
  const text = document.createElement("p"); text.className = "mt-3 whitespace-pre-wrap leading-7"; text.textContent = data.simplifiedText;
  const pointsTitle = document.createElement("h3"); pointsTitle.className = "mt-6 text-lg font-bold"; pointsTitle.textContent = "Key points";
  const points = document.createElement("ul"); points.className = "mt-2 list-disc space-y-2 pl-5";
  data.keyPoints.forEach((point) => { const item = document.createElement("li"); item.textContent = point; points.append(item); });
  container.append(heading, text, pointsTitle, points);
  if (data.caveats.length) { const caveat = document.createElement("aside"); caveat.className = "mt-6 rounded-lg border border-amber-300/50 bg-amber-100/10 p-4 text-amber-50"; caveat.setAttribute("aria-label", "Uncertain source wording"); caveat.innerHTML = "<strong>Uncertain or incomplete wording</strong>"; const list = document.createElement("ul"); list.className = "mt-2 list-disc pl-5"; data.caveats.forEach((entry) => { const item = document.createElement("li"); item.textContent = entry; list.append(item); }); caveat.append(list); container.append(caveat); }
}