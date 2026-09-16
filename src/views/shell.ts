export interface AppShell {
  dropZone: HTMLElement;
  fileInput: HTMLInputElement;
  ingestionStatus: HTMLElement;
  results: HTMLElement;
  chatHost: HTMLElement;
  compareDropZone: HTMLElement;
  compareFileInput: HTMLInputElement;
  compareStatus: HTMLElement;
  compareHost: HTMLElement;
}

export function renderShell(app: HTMLElement): AppShell {
  app.innerHTML = `
    <header class="border-b border-white/10"><nav class="mx-auto flex max-w-5xl items-center justify-between px-5 py-5" aria-label="Main navigation"><a href="/" class="text-xl font-black tracking-tight text-white">Lex<span class="text-teal-300">Clear</span></a><span class="rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1 text-xs font-semibold text-teal-100">Private by design · no saved documents</span></nav></header>
    <main id="main-content" class="mx-auto max-w-5xl px-5 py-10 sm:py-16">
      <section class="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><p class="text-sm font-bold uppercase tracking-[.18em] text-teal-300">Legal information, made usable</p><h1 class="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl">Read the fine print with confidence.</h1><p class="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Upload a legal document. LexClear explains it in plain language, surfaces key risks, and keeps every question grounded in the document itself.</p></div><aside class="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20"><p class="text-sm font-bold text-teal-200">Built for real documents</p><ul class="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>PDF & DOCX text extraction</li><li>OCR for scans and photos</li><li>Translation into your language</li></ul></aside></section>
      <section class="mt-10 rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 sm:p-8"><div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="text-2xl font-bold text-white">Start with a document</h2><p class="mt-1 text-slate-400">PDF, DOCX, PNG, or JPG · up to 10 MB</p></div><span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">No account required</span></div><label id="drop-zone" for="document-file" class="mt-6 block cursor-pointer rounded-2xl border-2 border-dashed border-slate-600 bg-slate-950/50 p-10 text-center transition duration-200 hover:border-teal-300 hover:bg-teal-300/5"><span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-300/10 text-2xl text-teal-200" aria-hidden="true">↑</span><strong class="mt-4 block text-lg text-white">Drop your document here</strong><span class="mt-1 block text-sm text-slate-400">or choose a file from your device</span></label><input id="document-file" class="sr-only" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"><p id="ingestion-status" class="mt-4 min-h-6 text-sm text-slate-300" role="status" aria-live="polite"></p></section>
      <section id="results" class="mt-10" hidden></section><section id="chat-host"></section>
      <details class="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5"><summary class="cursor-pointer font-bold text-teal-200">Compare a second document <span class="ml-1 text-sm font-normal text-slate-400">Optional — load only when needed</span></summary><div class="mt-5 border-t border-white/10 pt-5"><label id="compare-drop-zone" for="compare-file" class="block cursor-pointer rounded-xl border border-dashed border-slate-600 p-6 text-center transition hover:border-teal-300 hover:bg-teal-300/5"><strong class="text-white">Drop or choose the second document</strong><span class="mt-1 block text-sm text-slate-400">It will be compared against your first document.</span></label><input id="compare-file" class="sr-only" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"><p id="compare-status" class="mt-3 min-h-6 text-sm text-slate-300" role="status" aria-live="polite"></p></div></details><div id="compare-host"></div>
    </main><footer class="mx-auto max-w-5xl px-5 pb-10 text-sm leading-6 text-slate-400">LexClear explains documents in plain language. It is not a substitute for legal advice.</footer>`;

  return {
    dropZone: required(app, "#drop-zone"),
    fileInput: required(app, "#document-file"),
    ingestionStatus: required(app, "#ingestion-status"),
    results: required(app, "#results"),
    chatHost: required(app, "#chat-host"),
    compareDropZone: required(app, "#compare-drop-zone"),
    compareFileInput: required(app, "#compare-file"),
    compareStatus: required(app, "#compare-status"),
    compareHost: required(app, "#compare-host"),
  };
}

function required<T extends Element>(parent: HTMLElement, selector: string): T {
  const element = parent.querySelector<T>(selector);
  if (!element) throw new Error("Shell is missing " + selector);
  return element;
}
