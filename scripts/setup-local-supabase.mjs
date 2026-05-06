/**
 * Writes local public Supabase config from the running Supabase CLI stack.
 *
 * Source of truth: Supabase CLI status output and local-only public Supabase environment values.
 * Side effects: Writes `config/local.config.jsonc` and may seed local Supabase data when `--seed` is used.
 *
 * @module scripts/setup-local-supabase
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { stdout as defaultOutput } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { removeTrailingCommas, stripComments } from "./generate-config.mjs";
import {
  isLocalSupabaseUrl,
  normalizeEnvValue,
  parseSupabaseStatusEnv,
  seedLocalSupabase,
} from "./seed-local-supabase.mjs";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultLocalUrl = "http://127.0.0.1:54321";

function usage() {
  return `Usage: pnpm setup:local-supabase [--dry-run] [--force] [--seed]

Creates config/local.config.jsonc from the running local Supabase CLI stack.

Options:
  --dry-run  Print the local config that would be written
  --force    Replace an existing local config file
  --seed     Seed deterministic local Auth users and app data after setup
  --help     Show this help

Run pnpm exec supabase start before this command.
`;
}

function getLocalConfigPath(root) {
  return path.join(root, "config", "local.config.jsonc");
}

function getStatusEnvFromCli() {
  const result = spawnSync("pnpm", ["exec", "supabase", "status", "-o", "env"], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return {
      ok: false,
      statusEnv: new Map(),
      message: String(result.stderr || result.stdout || "").trim(),
    };
  }

  return {
    ok: true,
    statusEnv: parseSupabaseStatusEnv(result.stdout),
    message: "",
  };
}

function decodeJwtPayload(value) {
  const [, payload] = String(value || "").split(".");
  if (!payload) return {};

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function assertPublicSupabaseKey(value) {
  const key = normalizeEnvValue(value);
  if (!key) {
    throw new Error(
      "Missing local Supabase publishable key. Start Supabase locally and run `pnpm exec supabase status -o env`.",
    );
  }

  if (key.startsWith("sb_secret_")) {
    throw new Error("Refusing to write a Supabase secret key to config/local.config.jsonc.");
  }

  const payload = decodeJwtPayload(key);
  if (payload.role === "service_role") {
    throw new Error("Refusing to write a Supabase service-role key to config/local.config.jsonc.");
  }
}

function pickStatusValue(statusEnv, names) {
  for (const name of names) {
    const value = normalizeEnvValue(statusEnv.get(name));
    if (value) return value;
  }
  return "";
}

export function resolveLocalPublicSupabaseConfig({ env = process.env, statusEnv = new Map() } = {}) {
  const url = normalizeEnvValue(
    env.BRINGA_LOCAL_SUPABASE_URL ||
      env.SUPABASE_LOCAL_URL ||
      (isLocalSupabaseUrl(env.SUPABASE_URL) ? env.SUPABASE_URL : "") ||
      pickStatusValue(statusEnv, ["SUPABASE_URL", "API_URL"]) ||
      defaultLocalUrl,
  );

  const publishableKey = normalizeEnvValue(
    env.BRINGA_LOCAL_SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_LOCAL_PUBLISHABLE_KEY ||
      pickStatusValue(statusEnv, [
        "SUPABASE_PUBLISHABLE_KEY",
        "PUBLISHABLE_KEY",
        "SUPABASE_ANON_KEY",
        "ANON_KEY",
      ]),
  );

  if (!isLocalSupabaseUrl(url)) {
    throw new Error(`Refusing to configure non-local Supabase URL: ${url || "<empty>"}`);
  }

  assertPublicSupabaseKey(publishableKey);

  return {
    supabase: {
      url,
      publishableKey,
    },
    development: {
      localDemoMode: false,
    },
  };
}

/**
 * Serializes the ignored local config file using only public Supabase browser values.
 *
 * @param {{supabase: {url: string, publishableKey: string}}} config Local public Supabase config.
 * @returns {string} JSON config content with trailing newline.
 */
export function buildLocalConfigContent(config) {
  return `${JSON.stringify({
    supabase: {
      url: config.supabase.url,
      publishableKey: config.supabase.publishableKey,
    },
    development: {
      localDemoMode: false,
    },
  }, null, 2)}\n`;
}

async function readExistingLocalConfig(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(removeTrailingCommas(stripComments(content)));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Writes or previews the ignored local Supabase public config and optionally seeds local data.
 *
 * @param {object} options IO, env, force, dry-run, seed, and status-env options.
 * @returns {Promise<{config: object, filePath: string, seeded: boolean}>}
 */
export async function setupLocalSupabase({
  root = defaultRoot,
  env = process.env,
  output = defaultOutput,
  dryRun = false,
  force = false,
  seed = false,
  statusEnv,
} = {}) {
  let resolvedStatusEnv = statusEnv;
  if (!resolvedStatusEnv) {
    const statusResult = getStatusEnvFromCli();
    if (!statusResult.ok) {
      throw new Error(
        `Could not read local Supabase status. Run \`pnpm exec supabase start\` first.${statusResult.message ? `\n${statusResult.message}` : ""}`,
      );
    }
    resolvedStatusEnv = statusResult.statusEnv;
  }

  const config = resolveLocalPublicSupabaseConfig({ env, statusEnv: resolvedStatusEnv });
  const filePath = getLocalConfigPath(root);
  const existing = await readExistingLocalConfig(filePath);

  if (existing && !force && !dryRun) {
    throw new Error("config/local.config.jsonc already exists. Re-run with --force to replace it.");
  }

  const content = buildLocalConfigContent(config);

  if (dryRun) {
    output.write(`Dry run: would write config/local.config.jsonc:\n\n${content}`);
  } else {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
    output.write("Wrote config/local.config.jsonc with local public Supabase values.\n");
  }

  if (seed && !dryRun) {
    const result = await seedLocalSupabase({ env, statusEnv: resolvedStatusEnv });
    output.write(`Seeded local Supabase with ${result.users.length} users and ${result.items.length} items.\n`);
  } else if (seed) {
    output.write("Dry run: would seed local Supabase demo data.\n");
  }

  return {
    config,
    filePath,
    seeded: seed && !dryRun,
  };
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(usage());
    return;
  }

  await setupLocalSupabase({
    dryRun: process.argv.includes("--dry-run"),
    force: process.argv.includes("--force"),
    seed: process.argv.includes("--seed"),
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    console.error("");
    console.error(usage().trimEnd());
    process.exitCode = 1;
  });
}
