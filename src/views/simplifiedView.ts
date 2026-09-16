import type { SimplifiedResult } from "../lib/gemini";
import { getCachedTranslation, cacheTranslation, translateResult } from "../lib/translationClient";
import { classifyClauses, type ClauseRisk } from "../lib/riskScoring";
type Glossary = NonNullable<SimplifiedResult["glossary"]>;

export function renderRiskBadge(level: ClauseRisk): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className =
    "ml-2 inline-flex rounded-full px-2 py-1 text-xs font-bold " +
    (level === "high"
      ? "bg-rose-500/20 text-rose-100"
      : level === "medium"
        ? "bg-amber-400/20 text-amber-100"
        : "bg-teal-400/15 text-teal-100");
  badge.textContent = level + " risk";
  return badge;
}

export function renderSimplifiedView(
  container: HTMLElement,
  data: SimplifiedResult,
  original = data,
  activeLanguage = "",
  translationNotice = ""
): void {
  container.hidden = false;
  container.replaceChildren();
  container.className =
    "rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 sm:p-8";

  const header = document.createElement("div");
  header.className = "flex flex-wrap items-start justify-between gap-4";
  const eyebrow = document.createElement("div");
  eyebrow.innerHTML =
    '<p class="text-sm font-bold uppercase tracking-[.16em] text-teal-300">Your document, explained</p><h2 class="mt-2 text-3xl font-black text-white">In plain language</h2>';
  const language = document.createElement("select");
  language.className = "rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm";
  language.setAttribute("aria-label", "Output language");
  language.innerHTML =
    '<option value="">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option><option value="te">Telugu</option>';
  language.value = activeLanguage;
  header.append(eyebrow, language);

  const translationStatus = document.createElement("p");
  translationStatus.className = "mt-3 text-sm text-slate-400";
  translationStatus.setAttribute("aria-live", "polite");
  translationStatus.textContent = translationNotice;
  const text = document.createElement("p");
  text.className =
    "mt-6 whitespace-pre-wrap rounded-2xl border border-white/8 bg-slate-950/45 p-5 text-lg leading-8 text-slate-100";
  text.textContent = data.simplifiedText;
  const pointsTitle = document.createElement("h3");
  pointsTitle.className = "mt-8 text-xl font-bold text-white";
  pointsTitle.textContent = "Key points to keep in mind";
  const points = document.createElement("ul");
  points.className = "mt-4 grid gap-3";
  classifyClauses(data).forEach((entry) => {
    const item = document.createElement("li");
    item.className =
      "rounded-xl border border-white/8 bg-slate-950/35 p-4 leading-6 text-slate-200";
    item.textContent = entry.point;
    item.append(renderRiskBadge(entry.level));
    points.append(item);
  });

  language.onchange = async () => {
    const target = language.value;
    if (!target) {
      renderSimplifiedView(container, original, original, "");
      return;
    }
    const cached = getCachedTranslation(target, original.simplifiedText);
    if (cached) {
      renderSimplifiedView(
        container,
        cached.data,
        original,
        target,
        cached.fallback
          ? "Translation is unavailable for some content; English is shown where needed."
          : ""
      );
      return;
    }

    language.disabled = true;
    translationStatus.textContent = "Translating output…";
    const translated = await translateResult(original, target);
    cacheTranslation(target, original.simplifiedText, translated);
    renderSimplifiedView(
      container,
      translated.data,
      original,
      target,
      translated.fallback
        ? "Translation is unavailable for some content; English is shown where needed."
        : ""
    );
  };

  container.append(header, translationStatus, text, pointsTitle, points);
  renderGlossary(container, data.glossary ?? []);
  renderCaveats(container, data.caveats);
}

function renderGlossary(container: HTMLElement, glossary: Glossary): void {
  if (!glossary.length) return;
  const section = document.createElement("section");
  section.className = "mt-8";
  section.innerHTML =
    '<h3 class="text-xl font-bold text-white">Glossary</h3><p class="mt-1 text-sm text-slate-400">Open a term for its plain-language meaning.</p>';
  glossary.forEach((item) => {
    const details = document.createElement("details");
    details.className = "mt-3 rounded-xl border border-white/8 bg-slate-950/35 p-4";
    const summary = document.createElement("summary");
    summary.className =
      "cursor-pointer font-semibold text-teal-100 underline decoration-teal-300 underline-offset-4";
    summary.textContent = item.term;
    const definition = document.createElement("p");
    definition.className = "mt-3 leading-6 text-slate-300";
    definition.textContent = item.definition;
    details.append(summary, definition);
    section.append(details);
  });
  container.append(section);
}

function renderCaveats(container: HTMLElement, caveats: string[]): void {
  if (!caveats.length) return;
  const caveat = document.createElement("aside");
  caveat.className = "mt-8 rounded-xl border border-amber-300/80 bg-amber-100/15 p-5 text-amber-50";
  const title = document.createElement("strong");
  title.className = "block";
  title.textContent = "Uncertain or incomplete wording";
  const message = document.createElement("p");
  message.className = "mt-2 leading-6";
  message.textContent = caveats.join(" ");
  caveat.append(title, message);
  container.append(caveat);
}
