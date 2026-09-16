import { describe, it, expect, beforeEach, vi } from "vitest";
import { wireUpload, type UploadCallbacks } from "../../src/views/upload";

describe("upload view", () => {
  let dropZone: HTMLElement;
  let fileInput: HTMLInputElement;
  let status: HTMLElement;
  let callbacks: UploadCallbacks;

  beforeEach(() => {
    dropZone = document.createElement("div");
    fileInput = document.createElement("input");
    fileInput.type = "file";
    status = document.createElement("p");
    callbacks = {
      onText: vi.fn().mockResolvedValue(undefined),
    };
    vi.restoreAllMocks();
  });

  it("handles dragover and dragleave events on dropZone", () => {
    wireUpload(dropZone, fileInput, status, callbacks);

    const dragOverEvent = new Event("dragover", { cancelable: true });
    dropZone.dispatchEvent(dragOverEvent);
    expect(dropZone.classList.contains("drop-active")).toBe(true);

    const dragLeaveEvent = new Event("dragleave", { cancelable: true });
    dropZone.dispatchEvent(dragLeaveEvent);
    expect(dropZone.classList.contains("drop-active")).toBe(false);
  });

  it("shows error for unsupported file type", async () => {
    wireUpload(dropZone, fileInput, status, callbacks);

    const file = new File(["dummy content"], "test.exe", {
      type: "application/x-msdownload",
    });
    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false,
    });

    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe(
      "Choose a PDF, DOCX, PNG, or JPG under 10 MB."
    );
    expect(status.dataset.state).toBe("error");
    expect(callbacks.onText).not.toHaveBeenCalled();
  });

  it("shows error for file size > 10MB", async () => {
    wireUpload(dropZone, fileInput, status, callbacks);

    const bigFile = new File(["a"], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(bigFile, "size", { value: 10_000_001 });
    Object.defineProperty(fileInput, "files", {
      value: [bigFile],
      writable: false,
    });

    fileInput.dispatchEvent(new Event("change"));

    expect(status.textContent).toBe(
      "Choose a PDF, DOCX, PNG, or JPG under 10 MB."
    );
    expect(status.dataset.state).toBe("error");
    expect(callbacks.onText).not.toHaveBeenCalled();
  });

  it("processes valid file and calls onText callback upon successful OCR API call", async () => {
    wireUpload(dropZone, fileInput, status, callbacks);

    const validFile = new File(["sample text"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(fileInput, "files", {
      value: [validFile],
      writable: false,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { text: "Extracted legal document text", ocrUsed: false },
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    fileInput.dispatchEvent(new Event("change"));

    // Wait for async file reading & processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/ocr",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(callbacks.onText).toHaveBeenCalledWith("Extracted legal document text");
    expect(status.textContent).toBe("Ready");
    expect(status.dataset.state).toBe("complete");
  });

  it("handles OCR API failure gracefully", async () => {
    wireUpload(dropZone, fileInput, status, callbacks);

    const validFile = new File(["sample text"], "test.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(fileInput, "files", {
      value: [validFile],
      writable: false,
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "OCR processing error" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    fileInput.dispatchEvent(new Event("change"));

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(status.textContent).toBe("OCR processing error");
    expect(status.dataset.state).toBe("error");
    expect(callbacks.onText).not.toHaveBeenCalled();
  });
});
