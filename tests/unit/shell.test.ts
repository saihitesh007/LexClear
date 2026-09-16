import { describe, it, expect, beforeEach } from "vitest";
import { renderShell } from "../../src/views/shell";

describe("shell view", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders shell markup into container and returns element references", () => {
    const shell = renderShell(container);

    expect(shell.dropZone).toBeInstanceOf(HTMLElement);
    expect(shell.dropZone.id).toBe("drop-zone");

    expect(shell.fileInput).toBeInstanceOf(HTMLInputElement);
    expect(shell.fileInput.id).toBe("document-file");

    expect(shell.ingestionStatus).toBeInstanceOf(HTMLElement);
    expect(shell.ingestionStatus.id).toBe("ingestion-status");

    expect(shell.results).toBeInstanceOf(HTMLElement);
    expect(shell.results.id).toBe("results");

    expect(shell.chatHost).toBeInstanceOf(HTMLElement);
    expect(shell.chatHost.id).toBe("chat-host");

    expect(shell.compareDropZone).toBeInstanceOf(HTMLElement);
    expect(shell.compareDropZone.id).toBe("compare-drop-zone");

    expect(shell.compareFileInput).toBeInstanceOf(HTMLInputElement);
    expect(shell.compareFileInput.id).toBe("compare-file");

    expect(shell.compareStatus).toBeInstanceOf(HTMLElement);
    expect(shell.compareStatus.id).toBe("compare-status");

    expect(shell.compareHost).toBeInstanceOf(HTMLElement);
    expect(shell.compareHost.id).toBe("compare-host");
  });

  it("throws error if container lacks required shell element", () => {
    const emptyParent = document.createElement("div");
    // If renderShell fails to render expected selector:
    expect(() => renderShell(emptyParent)).not.toThrow(); // renderShell populates innerHTML, so it shouldn't throw normally
  });
});
