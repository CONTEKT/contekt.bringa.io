import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminNotificationSettings } from "../src/lib/admin-notification-settings.ts";

test("builds read-only notification settings for enabled telegram deployments", () => {
  const settings = buildAdminNotificationSettings({ telegramAdminNotifications: true });

  assert.deepEqual(
    settings.sections.map((section) => [section.key, section.label, section.status]),
    [
      ["telegram", "Telegram", "Configured"],
      ["mute", "Mute windows", "Prepared"],
      ["dedupe", "Dedupe", "Prepared"],
      ["seen", "Admin seen-state", "Prepared"],
    ],
  );
  assert.deepEqual(settings.muteWindows, ["1 day", "1 week", "Forever"]);
});

test("reports disabled telegram deployments without changing planned controls", () => {
  const settings = buildAdminNotificationSettings({ telegramAdminNotifications: false });

  assert.equal(settings.sections[0].status, "Disabled");
  assert.deepEqual(settings.muteWindows, ["1 day", "1 week", "Forever"]);
});
