import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminSystemHealthItems } from "../src/lib/admin-system-health.ts";

test("builds compact admin health items from public config", () => {
  const items = buildAdminSystemHealthItems({
    repositoryUrl: "https://github.com/example/app",
    telegramAdminNotifications: true,
    maxUploadBytes: 10_485_760,
    acceptedImageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  assert.deepEqual(
    items.map((item) => [item.key, item.label, item.value]),
    [
      ["config", "Config", "Manual CI"],
      ["supabase", "Supabase contract", "Local checker"],
      ["storage", "Storage contract", "10 MB, 3 types"],
      ["backups", "Backup freshness", "Manual backup"],
      ["docs", "Docs", "Manual workflow"],
      ["telegram", "Telegram", "Configured"],
    ],
  );
  assert.equal(items[0].href, "https://github.com/example/app/blob/main/docs/configuration.md");
  assert.equal(items[5].detail, "Mute, dedupe, and seen-state are prepared roadmap items.");
});

test("reports disabled telegram notifications without requiring a repository url", () => {
  const items = buildAdminSystemHealthItems({
    repositoryUrl: "",
    telegramAdminNotifications: false,
    maxUploadBytes: 5_000_000,
    acceptedImageMimeTypes: ["image/jpeg"],
  });

  const telegram = items.find((item) => item.key === "telegram");
  const storage = items.find((item) => item.key === "storage");

  assert.equal(telegram?.value, "Disabled");
  assert.equal(storage?.value, "5 MB, 1 type");
  assert.equal(items.some((item) => item.href), false);
});
