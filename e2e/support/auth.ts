import { expect, type Page } from "@playwright/test";

type LocalRole = "Admin" | "Member";

export async function signInAs(page: Page, role: LocalRole) {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.getByLabel(/I accept the/i).check();
  await page.getByRole("button", { name: role }).click();
  await page.getByRole("button", { name: "Sign in locally" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByLabel("Search items")).toBeVisible();
}

export async function signOut(page: Page) {
  await page.getByLabel("User menu").click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
}
