import { describe, it, expect, beforeEach } from "vitest";

import { renderRiskBadge, renderSimplifiedView } from "../../src/views/simplifiedView";
import type { SimplifiedResult } from "../../src/lib/gemini";

describe("simplifiedView", () => {
  let container: HTMLElement;

  const mockData: SimplifiedResult = {
    summary: "Brief summary of the document",
    simplifiedText: "This agreement grants non-exclusive license to user.",
    keyPoints: [
      "License terms apply",
      "Automatic renewal annually",
      "Liability uncapped for breach",
    ],
    glossary: [{ term: "License", definition: "Permission to use software." }],
    caveats: ["Clause 4 is ambiguous."],
  };

  beforeEach(() => {
    container = document.createElement("div");
  });

  describe("renderRiskBadge", () => {
    it("renders high risk badge correctly", () => {
      const badge = renderRiskBadge("high");
      expect(badge.textContent).toBe("high risk");
      expect(badge.className).toContain("bg-rose-500");
    });

    it("renders medium risk badge correctly", () => {
      const badge = renderRiskBadge("medium");
      expect(badge.textContent).toBe("medium risk");
      expect(badge.className).toContain("bg-amber-400");
    });

    it("renders low risk badge correctly", () => {
      const badge = renderRiskBadge("low");
      expect(badge.textContent).toBe("low risk");
      expect(badge.className).toContain("bg-teal-400");
    });
  });

  describe("renderSimplifiedView", () => {
    it("renders simplified view elements into container", () => {
      renderSimplifiedView(container, mockData);

      expect(container.hidden).toBe(false);
      expect(container.textContent).toContain("Your document, explained");
      expect(container.textContent).toContain(
        "This agreement grants non-exclusive license to user."
      );
      expect(container.textContent).toContain("Key points to keep in mind");

      // Glossary details
      expect(container.textContent).toContain("Glossary");
      expect(container.textContent).toContain("License");
      expect(container.textContent).toContain("Permission to use software.");

      // Caveats
      expect(container.textContent).toContain("Uncertain or incomplete wording");
      expect(container.textContent).toContain("Clause 4 is ambiguous.");
    });

    it("renders translation notice when provided", () => {
      const notice = "Translation is unavailable for some content.";
      renderSimplifiedView(container, mockData, mockData, "hi", notice);

      expect(container.textContent).toContain(notice);
      const select = container.querySelector<HTMLSelectElement>("select");
      expect(select?.value).toBe("hi");
    });

    it("handles language select change back to English", () => {
      renderSimplifiedView(container, mockData, mockData, "hi");

      const select = container.querySelector<HTMLSelectElement>("select")!;
      select.value = "";
      select.dispatchEvent(new Event("change"));

      const resetSelect = container.querySelector<HTMLSelectElement>("select");
      expect(resetSelect?.value).toBe("");
    });
  });
});
