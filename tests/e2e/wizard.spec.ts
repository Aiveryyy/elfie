import { test, expect } from "@playwright/test";

test("logs a state and shows it across the app", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Nothing has been logged yet.")).toBeVisible();

  await page.goto("/log");
  await page.getByLabel("Energy").fill("6.5");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "clear" }).click();
  await page.getByRole("button", { name: "locked-in" }).click();
  await page.getByRole("button", { name: "curious" }).click();
  await page.getByRole("button", { name: "systems" }).click();
  await page.getByRole("button", { name: "none" }).click();
  await page.getByRole("button", { name: "Save log" }).click();

  await expect(
    page.getByText(
      "E:6.5 | T:clear | A:locked-in | M:curious | D:systems | B:none",
    ),
  ).toBeVisible();

  await page.goto("/history");
  await expect(
    page.getByText(
      "E:6.5 | T:clear | A:locked-in | M:curious | D:systems | B:none",
    ),
  ).toBeVisible();

  await page.goto("/patterns");
  await expect(page.getByText("Patterns will become more descriptive as more logs accumulate.")).toBeVisible();
});
