import assert from "node:assert/strict";
import test from "node:test";

import { buildAdminRouteGate } from "../src/lib/admin-route-gate.ts";

test("shows loading while admin status is unresolved", () => {
  assert.deepEqual(buildAdminRouteGate({ adminLoading: true, isAdmin: false, contentLoading: true }), {
    redirectTo: null,
    showLoading: true,
    render: false,
  });
});

test("redirects non-admins before content loading state can mask access denial", () => {
  assert.deepEqual(buildAdminRouteGate({ adminLoading: false, isAdmin: false, contentLoading: true }), {
    redirectTo: "/dashboard",
    showLoading: false,
    render: false,
  });
});

test("shows content loading for admins while page data loads", () => {
  assert.deepEqual(buildAdminRouteGate({ adminLoading: false, isAdmin: true, contentLoading: true }), {
    redirectTo: null,
    showLoading: true,
    render: false,
  });
});

test("renders admin content only after role and content are ready", () => {
  assert.deepEqual(buildAdminRouteGate({ adminLoading: false, isAdmin: true, contentLoading: false }), {
    redirectTo: null,
    showLoading: false,
    render: true,
  });
});
