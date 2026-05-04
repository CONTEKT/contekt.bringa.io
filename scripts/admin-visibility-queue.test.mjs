import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminVisibilityQueue } from "../src/lib/admin-visibility-queue.ts";

test("builds pending visibility queue newest first", () => {
  const queue = buildAdminVisibilityQueue([
    {
      id: "visible",
      name: "Visible item",
      status: "inStock",
      visibility_state: "visible",
      visibility_reason: null,
      image_url: null,
      created_at: "2026-05-01T10:00:00.000Z",
    },
    {
      id: "pending-old",
      name: "Old pending item",
      status: "borrowed",
      visibility_state: "pending_visible",
      visibility_reason: "Owner requested publishing.",
      image_url: "/old.webp",
      created_at: "2026-05-02T10:00:00.000Z",
    },
    {
      id: "pending-new",
      name: "",
      status: "inStock",
      visibility_state: "pending_visible",
      visibility_reason: "",
      image_url: null,
      created_at: "2026-05-03T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(
    queue.map((item) => [item.id, item.nameLabel, item.reasonLabel]),
    [
      ["pending-new", "Unnamed item", "No reason recorded"],
      ["pending-old", "Old pending item", "Owner requested publishing."],
    ],
  );
});

test("keeps invalid dates from outranking valid pending items", () => {
  const queue = buildAdminVisibilityQueue([
    {
      id: "invalid",
      name: "Invalid date",
      status: "inStock",
      visibility_state: "pending_visible",
      visibility_reason: null,
      image_url: null,
      created_at: "not-a-date",
    },
    {
      id: "valid",
      name: "Valid date",
      status: "inStock",
      visibility_state: "pending_visible",
      visibility_reason: null,
      image_url: null,
      created_at: "2026-05-04T10:00:00.000Z",
    },
  ]);

  assert.deepEqual(queue.map((item) => item.id), ["valid", "invalid"]);
});
