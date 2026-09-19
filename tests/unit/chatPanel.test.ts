import { describe, it, expect, beforeEach, vi } from "vitest";
import { mountChatPanel } from "../../src/views/chatPanel";

describe("chatPanel view", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
    vi.restoreAllMocks();
  });

  it("mounts chat panel interface with grounded QA header", () => {
    mountChatPanel(host, "Document content text");

    expect(host.textContent).toContain("Ask about this document");
    expect(host.textContent).toContain("Grounded Q&A");
    expect(host.querySelector("#chat-input")).not.toBeNull();
    expect(host.querySelector("#chat-submit")).not.toBeNull();
  });

  it("submits first question with documentText, and subsequent question with documentHash only", async () => {
    const documentText = "This agreement auto-renews on January 1st each year.";
    mountChatPanel(host, documentText);

    const input = host.querySelector<HTMLInputElement>("#chat-input")!;
    const form = host.querySelector<HTMLFormElement>("#chat-form")!;

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: "According to the document, it auto-renews on January 1st.",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: "No notice period is required.",
          }),
      });
    vi.stubGlobal("fetch", mockFetch);

    input.value = "When does the agreement renew?";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("documentText") as unknown,
      })
    );

    input.value = "Is there a notice period?";
    form.dispatchEvent(new Event("submit", { cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.not.stringContaining("documentText") as unknown,
      })
    );

    const messages = host.querySelector<HTMLElement>("#messages");
    expect(messages?.textContent).toContain("No notice period is required.");
  });

  it("handles fetch error gracefully", async () => {
    mountChatPanel(host, "Doc text");

    const input = host.querySelector<HTMLInputElement>("#chat-input")!;
    const form = host.querySelector<HTMLFormElement>("#chat-form")!;

    input.value = "Is there a termination fee?";

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    form.dispatchEvent(new Event("submit", { cancelable: true }));

    await new Promise((resolve) => setTimeout(resolve, 50));

    const messages = host.querySelector("#messages");
    expect(messages?.textContent).toContain("Is there a termination fee?");
    expect(messages?.textContent).toContain(
      "Assistant unavailable. Please review the document directly."
    );
  });
});
