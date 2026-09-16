import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function mockDocumentFlow(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/ocr", async (route) =>
    route.fulfill({
      json: { data: { text: "Tenant shall pay $200 within 10 days.", ocrUsed: false } },
    })
  );
  await page.route("**/api/simplify", async (route) =>
    route.fulfill({
      json: {
        data: {
          simplifiedText: "The tenant must pay $200 within 10 days.",
          keyPoints: ["Tenant shall pay $200 within 10 days."],
          caveats: [],
          glossary: [],
        },
      },
    })
  );
  await page.route("**/api/chat", async (route) =>
    route.fulfill({ json: { data: "The document says the tenant must pay $200 within 10 days." } })
  );
}
async function loadResult(page: import("@playwright/test").Page): Promise<void> {
  await mockDocumentFlow(page);
  await page.goto("/");
  await page
    .locator("#document-file")
    .setInputFiles({
      name: "lease.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("sample"),
    });
  await expect(page.getByRole("heading", { name: "In plain language" })).toBeVisible();
}

test("upload page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""))
  ).toEqual([]);
});
test("simplified result has no serious accessibility violations", async ({ page }) => {
  await loadResult(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((v) => ["critical", "serious"].includes(v.impact ?? ""))
  ).toEqual([]);
});
test("happy path uploads, simplifies, and answers a grounded question", async ({ page }) => {
  await loadResult(page);
  await page.getByLabel("Your question about this document").fill("When is payment due?");
  await page.getByRole("button", { name: "Ask" }).click();
  await expect(
    page.getByText("The document says the tenant must pay $200 within 10 days.")
  ).toBeVisible();
});
