import { test } from "@playwright/test";

import { signInAs, signOut } from "../support/auth";

test("local Supabase seeded accounts can sign in and out through the UI", async ({ page }) => {
  await signInAs(page, "Admin");
  await signOut(page);
});
