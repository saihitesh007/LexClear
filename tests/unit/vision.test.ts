import { describe, it, expect, vi, beforeEach } from "vitest";
import { runVisionOcr } from "../../src/lib/vision";

describe("vision.ts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts text from Google Cloud Vision response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          responses: [
            {
              fullTextAnnotation: {
                text: "OCR detected text content",
              },
            },
          ],
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const text = await runVisionOcr("base64data", "test-api-key");
    expect(text).toBe("OCR detected text content");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("vision.googleapis.com"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws error when response is not ok", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(runVisionOcr("base64data", "bad-key")).rejects.toThrow(
      "Vision request failed"
    );
  });
});
