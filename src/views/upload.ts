const accepted = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"];
export interface UploadCallbacks { onText: (text: string) => Promise<void>; }

export function wireUpload(dropZone: HTMLElement, fileInput: HTMLInputElement, status: HTMLElement, callbacks: UploadCallbacks): void {
  const setStatus = (message: string, state = "working") => { status.textContent = message; status.dataset.state = state; };
  const process = async (file?: File) => {
    if (!file) return;
    if (!accepted.includes(file.type) || file.size > 10_000_000) { setStatus("Choose a PDF, DOCX, PNG, or JPG under 10 MB.", "error"); return; }
    setStatus("Reading document…");
    try {
      const base64 = await toBase64(file);
      setStatus("Running OCR…");
      const response = await fetch("/api/ocr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: file.name, imageBase64: base64, mimeType: file.type }) });
      const payload = await response.json() as { data?: { text: string; ocrUsed: boolean }; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error ?? "Couldn't read this document — try a clearer scan.");
      setStatus("Simplifying…");
      await callbacks.onText(payload.data.text);
      setStatus("Ready", "complete");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Couldn't read this document — try a clearer scan.", "error"); }
  };
  ["dragenter", "dragover"].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.add("drop-active"); }));
  ["dragleave", "drop"].forEach((name) => dropZone.addEventListener(name, (event) => { event.preventDefault(); dropZone.classList.remove("drop-active"); }));
  dropZone.addEventListener("drop", (event) => process(event.dataTransfer?.files[0]));
  fileInput.addEventListener("change", () => process(fileInput.files?.[0]));
}
function toBase64(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); }); }