type Message = { role: "You" | "LexClear"; content: string };

export function mountChatPanel(host: HTMLElement, documentText: string): void {
  const history: Array<{ role: "user" | "assistant"; content: string }> = [];
  host.innerHTML =
    '<details class="mt-6 rounded-2xl border border-white/10 bg-slate-900/75 p-5"><summary class="cursor-pointer text-lg font-bold text-white">Ask about this document <span class="ml-2 text-sm font-normal text-teal-200">Grounded Q&A</span></summary><div id="messages" class="mt-5 space-y-3" aria-live="polite"></div><form id="chat-form" class="mt-5 border-t border-white/10 pt-4"><p class="mb-3 text-xs leading-5 text-slate-400">General information only — not legal advice. Answers use the document you uploaded, not outside legal knowledge.</p><div class="flex gap-2"><label class="sr-only" for="chat-input">Your question about this document</label><input id="chat-input" class="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 p-3 text-slate-100" placeholder="What does the renewal clause mean?" required><button id="chat-submit" class="rounded-lg bg-teal-300 px-4 font-bold text-slate-950 transition hover:bg-teal-200">Ask</button></div></form></details>';

  const messages = host.querySelector<HTMLElement>("#messages")!;
  const input = host.querySelector<HTMLInputElement>("#chat-input")!;
  const submit = host.querySelector<HTMLButtonElement>("#chat-submit")!;
  const append = (message: Message) => {
    const item = document.createElement("article");
    item.className =
      "rounded-xl " +
      (message.role === "You" ? "bg-slate-800" : "border border-teal-300/20 bg-teal-300/8") +
      " p-4 text-sm leading-6";
    const label = document.createElement("strong");
    label.className = "block " + (message.role === "You" ? "text-slate-200" : "text-teal-200");
    label.textContent = message.role;
    const body = document.createElement("p");
    body.className = "mt-1 text-slate-200";
    body.textContent = message.content;
    item.append(label, body);
    messages.append(item);
  };

  host.querySelector<HTMLFormElement>("#chat-form")!.onsubmit = async (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question || submit.disabled) return;

    input.value = "";
    input.disabled = true;
    submit.disabled = true;
    submit.textContent = "Asking…";
    append({ role: "You", content: question });
    history.push({ role: "user", content: question });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText, question, history }),
      });
      const payload = (await response.json()) as { data?: string };
      const answer = payload.data ?? "Assistant unavailable. Please review the document directly.";
      append({ role: "LexClear", content: answer });
      history.push({ role: "assistant", content: answer });
    } catch {
      append({
        role: "LexClear",
        content: "Assistant unavailable. Please review the document directly.",
      });
    } finally {
      input.disabled = false;
      submit.disabled = false;
      submit.textContent = "Ask";
      input.focus();
    }
  };
}
