import { expect, test } from "@playwright/test";

import { signInAs } from "../support/auth";

test("admin can open admin dashboard", async ({ page }) => {
  await signInAs(page, "Admin");

  await page.goto("/admin/dashboard");
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
});

test("member cannot render admin dashboard", async ({ page }) => {
  await signInAs(page, "Member");

  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toHaveCount(0);
});
