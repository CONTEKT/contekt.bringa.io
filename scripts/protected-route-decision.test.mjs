import assert from "node:assert/strict";
import test from "node:test";

import { decideProtectedRoute } from "../src/lib/protected-route-decision.ts";

test("redirects unauthenticated or unreadable profiles to login", () => {
  assert.deepEqual(decideProtectedRoute({ hasSession: false, profile: null }), {
    authenticated: false,
    profileValid: false,
    redirectTo: "/login",
  });

  assert.deepEqual(decideProtectedRoute({ hasSession: true, profile: null, profileError: true }), {
    authenticated: false,
    profileValid: false,
    redirectTo: "/login",
  });
});

test("redirects unvalidated profiles to invite", () => {
  assert.deepEqual(
    decideProtectedRoute({
      hasSession: true,
      profile: {
        profile_valid: false,
        display_name: "Ada",
        display_surname: "Lovelace",
      },
    }),
    {
      authenticated: false,
      profileValid: false,
      redirectTo: "/invite",
    },
  );
});

test("redirects incomplete profiles to profile completion", () => {
  assert.deepEqual(
    decideProtectedRoute({
      hasSession: true,
      profile: {
        profile_valid: true,
        display_name: "Ada",
        display_surname: " ",
      },
    }),
    {
      authenticated: false,
      profileValid: true,
      redirectTo: "/complete-profile",
    },
  );
});

test("allows valid complete profiles through", () => {
  assert.deepEqual(
    decideProtectedRoute({
      hasSession: true,
      profile: {
        profile_valid: true,
        display_name: "Ada",
        display_surname: "Lovelace",
      },
    }),
    {
      authenticated: true,
      profileValid: true,
      redirectTo: null,
    },
  );
});
