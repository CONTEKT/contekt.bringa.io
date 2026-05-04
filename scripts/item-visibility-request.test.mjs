import assert from "node:assert/strict";
import test from "node:test";

import {
  buildItemVisibilityRequest,
  itemVisibilityActionForState,
} from "../src/lib/item-visibility-request.ts";

test("builds user hide requests with required reasons", () => {
  assert.deepEqual(buildItemVisibilityRequest({
    action: "hide",
    currentVisibility: "visible",
    reason: "  No longer available publicly. ",
  }), {
    ok: true,
    visibilityState: "user_hidden",
    reason: "No longer available publicly.",
  });

  assert.deepEqual(buildItemVisibilityRequest({
    action: "hide",
    currentVisibility: "admin_hidden",
    reason: "Keep hidden.",
  }), {
    ok: false,
    visibilityState: null,
    reason: null,
  });
});

test("builds request-visible actions without bypassing admin-hidden review", () => {
  assert.deepEqual(buildItemVisibilityRequest({
    action: "request_visible",
    currentVisibility: "user_hidden",
    reason: "  Ready to publish again. ",
  }), {
    ok: true,
    visibilityState: "pending_visible",
    reason: "Ready to publish again.",
  });

  assert.deepEqual(buildItemVisibilityRequest({
    action: "request_visible",
    currentVisibility: "visible",
    reason: "Already visible.",
  }), {
    ok: false,
    visibilityState: null,
    reason: null,
  });
});

test("selects the primary visibility action for item details", () => {
  assert.equal(itemVisibilityActionForState("visible"), "hide");
  assert.equal(itemVisibilityActionForState(null), "hide");
  assert.equal(itemVisibilityActionForState("user_hidden"), "request_visible");
  assert.equal(itemVisibilityActionForState("admin_hidden"), "request_visible");
  assert.equal(itemVisibilityActionForState("pending_visible"), null);
  assert.equal(itemVisibilityActionForState("archived"), null);
});
