import "./style.css";
import type { SimplifiedResult } from "./lib/gemini";
import { mountChatPanel } from "./views/chatPanel";
import { renderShell } from "./views/shell";
import { renderSimplifiedView } from "./views/simplifiedView";
import { wireUpload } from "./views/upload";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing app");

const shell = renderShell(app);
let firstText = "";

wireUpload(shell.dropZone, shell.fileInput, shell.ingestionStatus, {
  onText: async (text) => {
    firstText = text;
    const response = await fetch("/api/simplify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Uploaded document", text }),
    });
    const payload = (await response.json()) as { data?: SimplifiedResult; error?: string };
    if (!response.ok || !payload.data) throw new Error(payload.error ?? "Simplification failed");
    renderSimplifiedView(shell.results, payload.data);
    mountChatPanel(shell.chatHost, text);
    shell.results.scrollIntoView({ behavior: "smooth", block: "start" });
  },
});

wireUpload(shell.compareDropZone, shell.compareFileInput, shell.compareStatus, {
  onText: async (secondText) => {
    if (!firstText) throw new Error("Upload the primary document before adding one to compare.");
    const view = await import("./views/compareView");
    await view.mountCompareView(shell.compareHost, firstText, secondText);
  },
});
