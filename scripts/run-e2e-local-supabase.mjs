/**
 * Runs Playwright E2E checks against the local Supabase Docker stack.
 *
 * Source of truth: `playwright.config.ts`, `docs/browser-testing.md`, and
 * `docs/local-supabase-development.md`.
 * Side effects: Starts local Supabase containers, writes ignored local config,
 * may write generated local public config during the dev server run, and always
 * restores the default generated config before exit.
 *
 * @module scripts/run-e2e-local-supabase
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const playwrightArgs = [];
  let ci = false;

  for (const arg of argv) {
    if (arg === "--ci") {
      ci = true;
      continue;
    }
    playwrightArgs.push(arg);
  }

  return { ci, playwrightArgs };
}

function run(command, args, { allowFailure = false, env = process.env, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: quiet ? ["ignore", "pipe", "inherit"] : "inherit",
    });

    if (quiet) {
      child.stdout?.resume();
    }

    child.on("error", reject);
    child.on("close", (code) => {
      const exitCode = code ?? 1;
      if (!allowFailure && exitCode !== 0) {
        reject(new Error(`${command} ${args.join(" ")} exited with ${exitCode}.`));
        return;
      }
      resolve(exitCode);
    });
  });
}

function runPnpm(args, options) {
  return run("pnpm", args, options);
}

async function prepareLocalSupabase() {
  console.log("Starting local Supabase stack...");
  await runPnpm(["exec", "supabase", "start"], { quiet: true });
  await runPnpm(["setup:local-supabase", "--force", "--seed"]);
  await runPnpm(["doctor:local-supabase"]);
}

async function restoreGeneratedConfig() {
  const generateCode = await runPnpm(["generate:config"], { allowFailure: true });
  if (generateCode !== 0) return generateCode;
  return runPnpm(["check:config"], { allowFailure: true });
}

async function main(argv = process.argv.slice(2)) {
  const { ci, playwrightArgs } = parseArgs(argv);
  let testCode = 1;
  let restoreCode = 0;

  try {
    if (process.env.BRINGA_E2E_SKIP_SUPABASE_SETUP !== "true") {
      await prepareLocalSupabase();
    }

    testCode = await runPnpm(["exec", "playwright", "test", ...playwrightArgs], {
      allowFailure: true,
      env: {
        ...process.env,
        BRINGA_CONFIG_INCLUDE_LOCAL: "true",
        ...(ci ? { CI: "true" } : {}),
      },
    });
  } finally {
    restoreCode = await restoreGeneratedConfig();
  }

  process.exitCode = testCode || restoreCode;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(async (error) => {
    console.error(error.message);
    const restoreCode = await restoreGeneratedConfig();
    process.exitCode = restoreCode || 1;
  });
}
