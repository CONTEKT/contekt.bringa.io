import { expect, test } from "@playwright/test";

import { signInAs } from "../support/auth";

test("member dashboard starts on borrowed items and can search available items", async ({ page }) => {
  await signInAs(page, "Member");

  await expect(page.getByRole("button", { name: "Borrowed" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Local projector")).toBeVisible();

  await page.getByRole("button", { name: "Available" }).click();
  await expect(page.getByText("Local folding table")).toBeVisible();

  await page.getByLabel("Search items").fill("folding");
  await expect(page.getByText("Local folding table")).toBeVisible();
  await expect(page.getByText("Local projector")).toHaveCount(0);
});
