import { afterEach, describe, it, expect, beforeEach, vi } from "vitest";

import {
  renderRiskBadge,
  renderSimplifiedView,
} from "../../src/views/simplifiedView";
import * as translationClient from "../../src/lib/translationClient";
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
    vi.restoreAllMocks();
  });

  afterEach(() => vi.unstubAllGlobals());

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

    it("handles language select change back to English (re-renders with original data)", async () => {
      renderSimplifiedView(container, mockData, mockData, "hi");

      const select = container.querySelector<HTMLSelectElement>("select")!;
      select.value = "";
      select.dispatchEvent(new Event("change"));

      await new Promise((r) => setTimeout(r, 10));

      const resetSelect = container.querySelector<HTMLSelectElement>("select");
      expect(resetSelect?.value).toBe("");
    });

    it("uses cached translation when getCachedTranslation returns a result (lines 73-84)", async () => {
      const translatedData: SimplifiedResult = {
        ...mockData,
        simplifiedText: "This agreement in Hindi.",
      };
      vi.spyOn(translationClient, "getCachedTranslation").mockReturnValue({
        data: translatedData,
        fallback: false,
      });
      const cacheTranslationSpy = vi.spyOn(translationClient, "cacheTranslation");
      const translateResultSpy = vi.spyOn(translationClient, "translateResult");

      renderSimplifiedView(container, mockData, mockData, "");

      const select = container.querySelector<HTMLSelectElement>("select")!;
      select.value = "hi";
      select.dispatchEvent(new Event("change"));

      await new Promise((r) => setTimeout(r, 10));

      // Should use cache, not call translateResult
      expect(translateResultSpy).not.toHaveBeenCalled();
      expect(cacheTranslationSpy).not.toHaveBeenCalled();
    });

    it("calls translateResult and caches result on first translation (lines 86-98)", async () => {
      const translatedData: SimplifiedResult = {
        ...mockData,
        simplifiedText: "Translated text in Tamil.",
      };
      vi.spyOn(translationClient, "getCachedTranslation").mockReturnValue(undefined);
      const translateResultSpy = vi
        .spyOn(translationClient, "translateResult")
        .mockResolvedValue({ data: translatedData, fallback: false });
      const cacheTranslationSpy = vi.spyOn(translationClient, "cacheTranslation");

      renderSimplifiedView(container, mockData, mockData, "");

      const select = container.querySelector<HTMLSelectElement>("select")!;
      select.value = "ta";
      select.dispatchEvent(new Event("change"));

      await new Promise((r) => setTimeout(r, 30));

      expect(translateResultSpy).toHaveBeenCalledWith(mockData, "ta");
      expect(cacheTranslationSpy).toHaveBeenCalledWith("ta", mockData.simplifiedText, {
        data: translatedData,
        fallback: false,
      });
      // Container should now show the translated text
      expect(container.textContent).toContain("Translated text in Tamil.");
    });

    it("shows fallback notice when translateResult returns fallback: true (lines 95-97)", async () => {
      const translatedData: SimplifiedResult = {
        ...mockData,
        simplifiedText: "Partially translated text.",
      };
      vi.spyOn(translationClient, "getCachedTranslation").mockReturnValue(undefined);
      vi.spyOn(translationClient, "translateResult").mockResolvedValue({
        data: translatedData,
        fallback: true,
      });
      vi.spyOn(translationClient, "cacheTranslation");

      renderSimplifiedView(container, mockData, mockData, "");

      const select = container.querySelector<HTMLSelectElement>("select")!;
      select.value = "te";
      select.dispatchEvent(new Event("change"));

      await new Promise((r) => setTimeout(r, 30));

      expect(container.textContent).toContain(
        "Translation is unavailable for some content; English is shown where needed."
      );
    });
  });
});
