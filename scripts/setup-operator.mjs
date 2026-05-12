/**
 * Builds the operator setup checklist and optional deployment profile for a fork operator.
 *
 * Source of truth: Operator setup docs, deployment profile conventions, and package script names.
 * Side effects: May write a deployment profile through `createDeploymentProfile`; does not write secrets.
 *
 * @module scripts/setup-operator
 */
import { createInterface } from "node:readline/promises";
import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDeploymentProfile,
  normalizeDeploymentSlug,
} from "./create-deployment-profile.mjs";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicSupabaseUrlPlaceholder = "https://replace-with-your-project-ref.supabase.co";
const publicSupabaseKeyPlaceholder = "replace-with-your-public-publishable-key";

function usage() {
  return `Usage: pnpm setup:operator [--dry-run] [--force]

Interactive first-run helper for fork operators. It creates a public
deployment profile and prints the remaining GitHub Pages and Supabase steps.

Options:
  --dry-run  Preview the generated deployment profile without writing it
  --force    Replace an existing profile
  --help     Show this help

It never asks for Supabase maintenance keys, OAuth secrets, or provider secrets.
`;
}

function defaultGithubOwner(env = process.env) {
  return env.GITHUB_REPOSITORY_OWNER?.trim() || env.GITHUB_REPOSITORY?.split("/")?.[0] || "replace-with-your-github-owner";
}

function defaultGithubRepo(env = process.env) {
  return env.GITHUB_REPOSITORY?.split("/")?.[1] || "app.bringa.io";
}

function answerOrDefault(value, fallback) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function answerToBoolean(value, fallback) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  return ["1", "true", "yes", "y"].includes(normalized);
}

async function ask(questioner, label, fallback) {
  const suffix = fallback ? ` [${fallback}]` : "";
  const answer = await questioner.question(`${label}${suffix}: `);
  return answerOrDefault(answer, fallback);
}

export function resolveOperatorSetupAnswers(answers, env = process.env) {
  const slug = normalizeDeploymentSlug(answers.slug);
  return {
    slug,
    githubOwner: answerOrDefault(answers.githubOwner, defaultGithubOwner(env)),
    githubRepo: answerOrDefault(answers.githubRepo, defaultGithubRepo(env)),
    operatorName: answerOrDefault(answers.operatorName, slug),
    canonicalUrl: answerOrDefault(answers.canonicalUrl, `https://${slug}`),
    supabaseUrl: answerOrDefault(answers.supabaseUrl, publicSupabaseUrlPlaceholder),
    supabasePublishableKey: answerOrDefault(answers.supabasePublishableKey, publicSupabaseKeyPlaceholder),
    useDeployBranch: answerToBoolean(answers.useDeployBranch, true),
  };
}

/**
 * Builds the post-scaffold checklist without writing files or secrets.
 *
 * @param {{slug: string, useDeployBranch: boolean}} options Operator setup choices.
 * @returns {string[]} Ordered next-step lines for the operator.
 */
export function buildOperatorSetupChecklist({ slug, useDeployBranch }) {
  const branch = `deploy/${slug}`;
  const lines = [
    "Next steps:",
  ];

  if (useDeployBranch) {
    lines.push(`1. Optional publishing branch: git switch -c ${branch}`);
  } else {
    lines.push("1. Continue on your chosen publishing branch.");
  }

  lines.push(
    `2. Generate config: BRINGA_DEPLOYMENT=${slug} pnpm generate:config`,
    `3. Check config: BRINGA_DEPLOYMENT=${slug} pnpm check:config`,
    "4. Apply the committed Supabase schema and migrations to your Supabase project.",
    "5. Set Supabase Auth Site URL to your app URL and add the exact /dashboard redirect URL.",
    "6. For first-admin bootstrap, backups, and trusted cleanup only, copy .env.example to .env.local, set SUPABASE_PROJECT_REF or SUPABASE_URL, and set SUPABASE_SECRET_KEY or SUPABASE_SECRET_KEYS after confirming the target project.",
    "7. After the intended first admin signs in once, run pnpm bootstrap:first-admin --confirm-project-ref <ref> to dry-run, then add --execute when the target is correct.",
    "8. In GitHub, set Pages source to GitHub Actions and configure your custom domain if you use one.",
    "9. In DNS, point the subdomain CNAME to <github-owner>.github.io without the repository name.",
    `10. Run the manual Pages workflow with deployment=${slug}.`,
    "11. After DNS resolves, wait for the GitHub Pages certificate, then enable Enforce HTTPS. GitHub says this can take up to 24 hours, so a pending certificate is normal.",
    "12. Run pnpm build before publishing changes.",
  );

  return lines;
}

/**
 * Creates or previews the deployment profile from already-collected operator answers.
 *
 * @param {object} options Raw answers plus IO, env, and file-writing controls.
 * @returns {Promise<object>} Deployment profile result plus branch preference.
 */
export async function createOperatorSetupFromAnswers({
  root = defaultRoot,
  rawAnswers,
  env = process.env,
  output = defaultOutput,
  force = false,
  dryRun = false,
} = {}) {
  const resolved = resolveOperatorSetupAnswers(rawAnswers, env);
  const result = await createDeploymentProfile({
    root,
    force,
    dryRun,
    slug: resolved.slug,
    githubOwner: resolved.githubOwner,
    githubRepo: resolved.githubRepo,
    operatorName: resolved.operatorName,
    canonicalUrl: resolved.canonicalUrl,
    supabaseUrl: resolved.supabaseUrl,
    supabasePublishableKey: resolved.supabasePublishableKey,
  });

  if (result.dryRun) {
    output.write(`\nDry run: would create ${result.relativePath}.\n\n`);
    output.write(`${result.content.trimEnd()}\n\n`);
  } else {
    output.write(`\nCreated ${result.relativePath}.\n\n`);
  }

  for (const line of buildOperatorSetupChecklist(resolved)) {
    output.write(`${line}\n`);
  }

  return {
    ...result,
    useDeployBranch: resolved.useDeployBranch,
  };
}

/**
 * Runs the interactive operator setup prompt and delegates profile creation.
 *
 * @param {object} options IO, env, and file-writing options.
 * @returns {Promise<object>} Deployment profile result plus branch preference.
 */
export async function runOperatorSetup({
  root = defaultRoot,
  input = defaultInput,
  output = defaultOutput,
  env = process.env,
  force = false,
  dryRun = false,
} = {}) {
  const questioner = createInterface({ input, output });

  try {
    output.write("bringa operator setup\n\n");
    const rawAnswers = {
      slug: await ask(questioner, "Deployment slug or app domain", ""),
      githubOwner: await ask(questioner, "GitHub owner", defaultGithubOwner(env)),
      githubRepo: await ask(questioner, "GitHub repository", defaultGithubRepo(env)),
      operatorName: await ask(questioner, "Operator name", ""),
      canonicalUrl: await ask(questioner, "Public app URL", ""),
      supabaseUrl: await ask(questioner, "Public Supabase project URL", publicSupabaseUrlPlaceholder),
      supabasePublishableKey: await ask(questioner, "Public Supabase publishable key", publicSupabaseKeyPlaceholder),
      useDeployBranch: await ask(questioner, "Use a deploy/<slug> publishing branch? yes/no", "yes"),
    };

    return await createOperatorSetupFromAnswers({
      root,
      rawAnswers,
      env,
      output,
      force,
      dryRun,
    });
  } finally {
    questioner.close();
  }
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    process.stdout.write(usage());
    return;
  }

  await runOperatorSetup({
    force: process.argv.includes("--force"),
    dryRun: process.argv.includes("--dry-run"),
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
