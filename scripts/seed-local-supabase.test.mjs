import assert from "node:assert/strict";
import test from "node:test";

import {
  isLocalSupabaseUrl,
  localSeedItems,
  localSeedUsers,
  parseSupabaseStatusEnv,
  resolveLocalSupabaseCredentials,
} from "./seed-local-supabase.mjs";

test("recognizes local Supabase URLs only", () => {
  assert.equal(isLocalSupabaseUrl("http://127.0.0.1:54321"), true);
  assert.equal(isLocalSupabaseUrl("http://localhost:54321"), true);
  assert.equal(isLocalSupabaseUrl("https://example.supabase.co"), false);
  assert.equal(isLocalSupabaseUrl("not a url"), false);
});

test("parses supabase status env output without printing secrets", () => {
  const values = parseSupabaseStatusEnv(`
API_URL=http://127.0.0.1:54321
SERVICE_ROLE_KEY="local-secret"
ANON_KEY=local-anon
`);

  assert.equal(values.get("API_URL"), "http://127.0.0.1:54321");
  assert.equal(values.get("SERVICE_ROLE_KEY"), "local-secret");
  assert.equal(values.get("ANON_KEY"), "local-anon");
});

test("resolves explicit local credentials and ignores remote production env URLs", () => {
  const credentials = resolveLocalSupabaseCredentials({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SECRET_KEY: "remote-secret",
    BRINGA_LOCAL_SUPABASE_URL: "http://127.0.0.1:54321",
    BRINGA_LOCAL_SUPABASE_SECRET_KEY: "local-secret",
  });

  assert.deepEqual(credentials, {
    url: "http://127.0.0.1:54321",
    secretKey: "local-secret",
  });
});

test("uses local status output when explicit env is absent", () => {
  const credentials = resolveLocalSupabaseCredentials({}, parseSupabaseStatusEnv(`
SUPABASE_URL=http://127.0.0.1:54321
SERVICE_ROLE_KEY=local-service-role
`));

  assert.deepEqual(credentials, {
    url: "http://127.0.0.1:54321",
    secretKey: "local-service-role",
  });
});

test("keeps local seed fixtures compact and deterministic", () => {
  assert.deepEqual(localSeedUsers.map((user) => user.email), [
    "admin@bringa.local",
    "member@bringa.local",
  ]);
  assert.equal(localSeedItems.length, 3);
  assert.equal(new Set(localSeedItems.map((item) => item.id)).size, localSeedItems.length);
});
