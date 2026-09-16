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

  it("submits question, sends request to /api/chat, and renders assistant response", async () => {
    const documentText = "This agreement auto-renews on January 1st each year.";
    mountChatPanel(host, documentText);

    const input = host.querySelector<HTMLInputElement>("#chat-input")!;
    const form = host.querySelector<HTMLFormElement>("#chat-form")!;

    input.value = "When does the agreement renew?";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: "According to the document, it auto-renews on January 1st.",
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const submitEvent = new Event("submit", { cancelable: true });
    form.dispatchEvent(submitEvent);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("When does the agreement renew?") as unknown,
      })
    );

    const messages = host.querySelector<HTMLElement>("#messages");

    expect(messages?.textContent).toContain("When does the agreement renew?");
    expect(messages?.textContent).toContain(
      "According to the document, it auto-renews on January 1st."
    );
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
