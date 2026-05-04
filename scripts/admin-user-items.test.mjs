import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminUserItemGroups } from "../src/lib/admin-user-items.ts";

const userId = "profile-1";

function item(overrides) {
  return {
    id: "item",
    name: "Item",
    created_at: "2026-05-01T10:00:00.000Z",
    created_by: "other-profile",
    borrowed_by: null,
    owner_profile_id: null,
    owner_kind: "operator",
    status: "inStock",
    visibility_state: "visible",
    ...overrides,
  };
}

test("groups items connected to a user without duplicates", () => {
  const groups = buildAdminUserItemGroups([
    item({
      id: "borrowed",
      name: "Borrowed drill",
      borrowed_by: userId,
      status: "borrowed",
      created_at: "2026-05-04T10:00:00.000Z",
    }),
    item({
      id: "owned-created",
      name: "Owned and created camera",
      created_by: userId,
      owner_profile_id: userId,
      owner_kind: "profile",
      created_at: "2026-05-03T10:00:00.000Z",
    }),
    item({
      id: "created",
      name: "Created operator table",
      created_by: userId,
      owner_kind: "operator",
      created_at: "2026-05-02T10:00:00.000Z",
    }),
    item({ id: "unrelated", name: "Other item" }),
  ], userId);

  assert.deepEqual(groups.map((group) => group.key), ["borrowed", "owned", "created"]);
  assert.deepEqual(groups.map((group) => group.items.map((row) => row.item.id)), [
    ["borrowed"],
    ["owned-created"],
    ["created"],
  ]);
  assert.deepEqual(groups[1].items[0].relationLabels, ["Owner", "Creator"]);
});

test("sorts matching items newest first inside each group", () => {
  const groups = buildAdminUserItemGroups([
    item({ id: "older", created_by: userId, created_at: "2026-05-01T10:00:00.000Z" }),
    item({ id: "newer", created_by: userId, created_at: "2026-05-04T10:00:00.000Z" }),
  ], userId);

  assert.deepEqual(groups[0].items.map((row) => row.item.id), ["newer", "older"]);
});
