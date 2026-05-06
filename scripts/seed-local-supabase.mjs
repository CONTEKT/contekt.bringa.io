/**
 * Seeds deterministic local-only Supabase Auth users and app data for development and tests.
 *
 * Source of truth: Fixture arrays in this script and local Supabase credentials.
 * Side effects: Writes to local Supabase Auth and application tables; refuses non-local Supabase URLs.
 *
 * @module scripts/seed-local-supabase
 */
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const defaultLocalUrl = "http://127.0.0.1:54321";

/** @type {Array<{key: string, email: string, password: string, display_name: string, display_surname: string, description: string, profile_valid: boolean, invited_by_code: string}>} */
export const localSeedUsers = [
  {
    key: "admin",
    email: "admin@bringa.local",
    password: "bringa-local-admin-123",
    display_name: "Local",
    display_surname: "Admin",
    description: "Local development administrator.",
    profile_valid: true,
    invited_by_code: "LOCAL-DEMO",
  },
  {
    key: "member",
    email: "member@bringa.local",
    password: "bringa-local-member-123",
    display_name: "Local",
    display_surname: "Member",
    description: "Local development member.",
    profile_valid: true,
    invited_by_code: "LOCAL-DEMO",
  },
];

/** @type {Array<{id: string, name: string, description: string, status: string, owner_kind: string, owner_label: string, visibility_state: string, handoff_policy: string}>} */
export const localSeedItems = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Local folding table",
    description: "A sturdy table for testing visible operator-owned items.",
    status: "inStock",
    owner_kind: "operator",
    owner_label: "Local demo operator",
    visibility_state: "visible",
    handoff_policy: "return_to_owner",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Local projector",
    description: "Borrowed fixture item for dashboard and return-flow testing.",
    status: "borrowed",
    owner_kind: "operator",
    owner_label: "Local demo operator",
    visibility_state: "visible",
    handoff_policy: "direct_handoff_allowed",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Long local viewport test item with wrapping title",
    description: "A deliberately long description for local Supabase layout checks across narrow viewports.",
    status: "inStock",
    owner_kind: "operator",
    owner_label: "Local demo operator",
    visibility_state: "visible",
    handoff_policy: "return_to_owner",
  },
];

export function normalizeEnvValue(value) {
  return String(value || "").trim().replace(/^["']|["']$/g, "");
}

/**
 * Parses `supabase status -o env` output into a process-env-like map.
 *
 * @param {string} output Supabase CLI env output.
 * @returns {Map<string, string>} Parsed env values.
 */
export function parseSupabaseStatusEnv(output) {
  const values = new Map();

  for (const line of String(output || "").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    values.set(match[1], normalizeEnvValue(match[2]));
  }

  return values;
}

export function isLocalSupabaseUrl(value) {
  try {
    const parsed = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Resolves local-only Supabase URL and trusted seed key from env or Supabase CLI status output.
 *
 * @param {NodeJS.ProcessEnv} env Environment map to read.
 * @param {Map<string, string>} statusEnv Parsed `supabase status -o env` output.
 * @returns {{url: string, secretKey: string}} Local Supabase credentials.
 */
export function resolveLocalSupabaseCredentials(env = process.env, statusEnv = new Map()) {
  const url = normalizeEnvValue(
    env.BRINGA_LOCAL_SUPABASE_URL ||
      env.SUPABASE_LOCAL_URL ||
      (isLocalSupabaseUrl(env.SUPABASE_URL) ? env.SUPABASE_URL : "") ||
      statusEnv.get("SUPABASE_URL") ||
      statusEnv.get("API_URL") ||
      defaultLocalUrl,
  );

  const secretKey = normalizeEnvValue(
    env.BRINGA_LOCAL_SUPABASE_SECRET_KEY ||
      env.SUPABASE_LOCAL_SECRET_KEY ||
      (isLocalSupabaseUrl(url) ? env.SUPABASE_SECRET_KEY : "") ||
      (isLocalSupabaseUrl(url) ? env.SUPABASE_SERVICE_ROLE_KEY : "") ||
      statusEnv.get("SUPABASE_SECRET_KEY") ||
      statusEnv.get("SERVICE_ROLE_KEY") ||
      statusEnv.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  return { url, secretKey };
}

function getStatusEnvFromCli() {
  const result = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return new Map();
  }

  return parseSupabaseStatusEnv(result.stdout);
}

function assertLocalCredentials({ url, secretKey }) {
  if (!isLocalSupabaseUrl(url)) {
    throw new Error(`Refusing to seed non-local Supabase URL: ${url || "<empty>"}`);
  }
  if (!secretKey) {
    throw new Error(
      "Missing local Supabase secret key. Start Supabase locally, run `pnpm exec supabase status -o env`, or set BRINGA_LOCAL_SUPABASE_SECRET_KEY.",
    );
  }
}

async function listAuthUsers(supabase) {
  const users = [];

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    users.push(...(data?.users || []));
    if (!data?.users || data.users.length < 1000) break;
  }

  return users;
}

async function ensureAuthUser(supabase, fixture) {
  const existingUsers = await listAuthUsers(supabase);
  const existing = existingUsers.find((user) => user.email?.toLowerCase() === fixture.email.toLowerCase());
  if (existing) return existing;

  const { data, error } = await supabase.auth.admin.createUser({
    email: fixture.email,
    password: fixture.password,
    email_confirm: true,
    user_metadata: {
      display_name: fixture.display_name,
      display_surname: fixture.display_surname,
    },
  });

  if (error) throw error;
  return data.user;
}

async function upsertProfile(supabase, user, fixture) {
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: fixture.email,
      display_name: fixture.display_name,
      display_surname: fixture.display_surname,
      description: fixture.description,
      profile_valid: fixture.profile_valid,
      invited_by_code: fixture.invited_by_code,
    }, { onConflict: "id" });

  if (error) throw error;
}

async function seedLocalData(supabase) {
  const usersByKey = new Map();

  for (const fixture of localSeedUsers) {
    const user = await ensureAuthUser(supabase, fixture);
    await upsertProfile(supabase, user, fixture);
    usersByKey.set(fixture.key, user);
  }

  const adminUser = usersByKey.get("admin");
  const memberUser = usersByKey.get("member");

  const { error: adminError } = await supabase
    .from("admins")
    .upsert({ profile_id: adminUser.id, invite_code: "LOCAL-DEMO" }, { onConflict: "profile_id" });
  if (adminError) throw adminError;

  for (const item of localSeedItems) {
    const { error } = await supabase
      .from("items")
      .upsert({
        ...item,
        created_by: adminUser.id,
        borrowed_by: item.status === "borrowed" ? memberUser.id : null,
      }, { onConflict: "id" });
    if (error) throw error;
  }

  const { error: historyError } = await supabase
    .from("borrow_history")
    .upsert({
      id: "44444444-4444-4444-8444-444444444444",
      item_id: "22222222-2222-4222-8222-222222222222",
      borrower_id: memberUser.id,
      borrowed_at: "2026-05-05T10:00:00Z",
      returned_at: null,
      notes: "Local seed borrow history.",
    }, { onConflict: "id" });
  if (historyError) throw historyError;

  return {
    users: localSeedUsers.map((user) => user.email),
    items: localSeedItems.map((item) => item.name),
    inviteCode: "LOCAL-DEMO",
  };
}

/**
 * Seeds the deterministic local fixture set into a local Supabase project.
 *
 * @param {object} options Environment and optional parsed Supabase CLI status values.
 * @returns {Promise<{users: string[], items: string[], inviteCode: string}>}
 */
export async function seedLocalSupabase({ env = process.env, statusEnv } = {}) {
  const credentials = resolveLocalSupabaseCredentials(env, statusEnv || getStatusEnvFromCli());
  assertLocalCredentials(credentials);

  const supabase = createClient(credentials.url, credentials.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return seedLocalData(supabase);
}

export async function main() {
  const result = await seedLocalSupabase();
  console.log(`Seeded local Supabase with ${result.users.length} users, ${result.items.length} items, and invite code ${result.inviteCode}.`);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
