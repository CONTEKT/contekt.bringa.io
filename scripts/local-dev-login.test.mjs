import assert from "node:assert/strict";
import test from "node:test";

import {
  localDevEmailAccounts,
  isLocalSupabaseDevelopment,
} from "../src/lib/local-dev-login.ts";

test("enables local dev email login only for local Supabase development", () => {
  assert.equal(
    isLocalSupabaseDevelopment({
      config: {
        supabase: { url: "http://127.0.0.1:54321" },
        development: { localDemoMode: false },
      },
      nodeEnv: "development",
    }),
    true,
  );

  assert.equal(
    isLocalSupabaseDevelopment({
      config: {
        supabase: { url: "https://example.supabase.co" },
        development: { localDemoMode: false },
      },
      nodeEnv: "development",
    }),
    false,
  );

  assert.equal(
    isLocalSupabaseDevelopment({
      config: {
        supabase: { url: "http://127.0.0.1:54321" },
        development: { localDemoMode: true },
      },
      nodeEnv: "development",
    }),
    false,
  );

  assert.equal(
    isLocalSupabaseDevelopment({
      config: {
        supabase: { url: "http://127.0.0.1:54321" },
        development: { localDemoMode: false },
      },
      nodeEnv: "production",
    }),
    false,
  );
});

test("documents seeded local Supabase accounts for the dev login", () => {
  assert.deepEqual(localDevEmailAccounts, [
    {
      label: "Admin",
      email: "admin@bringa.local",
      password: "bringa-local-admin-123",
    },
    {
      label: "Member",
      email: "member@bringa.local",
      password: "bringa-local-member-123",
    },
  ]);
});
