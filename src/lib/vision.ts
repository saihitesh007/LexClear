export async function runVisionOcr(imageBase64: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://vision.googleapis.com/v1/images:annotate?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          { image: { content: imageBase64 }, features: [{ type: "DOCUMENT_TEXT_DETECTION" }] },
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    }
  );
  if (!response.ok) throw new Error("Vision request failed");
  const body = (await response.json()) as {
    responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
  };
  return body.responses?.[0]?.fullTextAnnotation?.text ?? "";
}
