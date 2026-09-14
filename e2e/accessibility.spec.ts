import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});

test("sample results are keyboard-accessible and have no serious violations", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Use sample" }).click();
  await page.getByRole("button", { name: /Simplify document/ }).click();
  await expect(page.getByRole("heading", { name: "Pasted document" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});
