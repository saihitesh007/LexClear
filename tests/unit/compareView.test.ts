import { describe, it, expect, beforeEach, vi } from "vitest";
import { mountCompareView } from "../../src/views/compareView";

describe("compareView", () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement("div");
    vi.restoreAllMocks();
  });

  it("renders previews for original Document A and Document B and displays differences from API", async () => {
    const mockComparisonResult = {
      summary: "Document B increases subscription fee and shortens notice period.",
      differences: [
        {
          clause: "Notice Period",
          significance: "critical" as const,
          docA: "30 days notice required",
          docB: "7 days notice required",
        },
        {
          clause: "Typo fix",
          significance: "cosmetic" as const,
          docA: "Teh company",
          docB: "The company",
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockComparisonResult }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const firstDoc = "First original document content";
    const secondDoc = "Second modified document content";

    await mountCompareView(host, firstDoc, secondDoc);

    expect(host.textContent).toContain(firstDoc);
    expect(host.textContent).toContain(secondDoc);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/compare",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ first: firstDoc, second: secondDoc }),
      })
    );

    expect(host.textContent).toContain("What changed");
    expect(host.textContent).toContain(
      "Document B increases subscription fee and shortens notice period."
    );
    expect(host.textContent).toContain("CRITICAL · Notice Period");
    expect(host.textContent).toContain("Document A: 30 days notice required");
    expect(host.textContent).toContain("Document B: 7 days notice required");
  });

  it("handles API failure gracefully with fallback message", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Comparison service error" }),
    });

    vi.stubGlobal("fetch", mockFetch);

    await mountCompareView(host, "Doc A", "Doc B");

    expect(host.textContent).toContain(
      "Comparison is temporarily unavailable. Review the two originals side by side."
    );
  });
});
