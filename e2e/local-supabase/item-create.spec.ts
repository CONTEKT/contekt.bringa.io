import { expect, test } from "@playwright/test";

import { signInAs } from "../support/auth";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64",
);

test("admin can create an item with a real local Storage image upload", async ({ page }) => {
  await signInAs(page, "Admin");

  const itemName = `Playwright Storage Item ${Date.now()}`;
  await page.getByRole("link", { name: "Create Item" }).click();
  await expect(page.getByRole("heading", { name: "Create New Item" })).toBeVisible();

  await page.getByLabel("Item Name").fill(itemName);
  await page.getByLabel("Description").fill("Created by the local Supabase Playwright smoke test.");
  await page.locator("input[type='file']").setInputFiles({
    name: "tiny.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await expect(page.getByAltText("Selected item image preview")).toBeVisible();

  await page.getByRole("button", { name: "Create Item" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "All Items" }).click();
  await page.getByLabel("Search items").fill(itemName);
  await expect(page.getByText(itemName)).toBeVisible();
});
