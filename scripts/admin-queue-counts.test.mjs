import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminQueueCounts } from "../src/lib/admin-queue-counts.ts";

test("counts pending admin queues without treating closed records as open", () => {
  const counts = buildAdminQueueCounts({
    suggestions: [{ status: "pending" }, { status: "reviewing" }, { status: "accepted" }],
    flags: [{ status: "pending" }, { status: "resolved" }],
    deletionRequests: [{ status: "pending" }, { status: "reviewing" }, { status: "completed" }],
    profiles: [{ profile_valid: false }, { profile_valid: true }, { profile_valid: null }],
  });

  assert.deepEqual(counts, {
    pendingSuggestions: 1,
    pendingFlags: 1,
    openDeletionRequests: 2,
    pendingUsers: 1,
  });
});

test("handles missing queue data as empty collections", () => {
  assert.deepEqual(buildAdminQueueCounts({}), {
    pendingSuggestions: 0,
    pendingFlags: 0,
    openDeletionRequests: 0,
    pendingUsers: 0,
  });
});
