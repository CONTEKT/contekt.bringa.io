/**
 * Checks documentation source-of-truth boundaries and fork-friendly health rules.
 *
 * Source of truth: `docs/conventions.md`, canonical fork runbooks, and `package.json` scripts.
 * Side effects: None beyond CLI output and exit status.
 *
 * @module scripts/check-docs-health
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  findMissingDocsIndexLinks,
  findMissingGeneratedDocsArtifacts,
} from "./check-docs-index.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedNonScriptCommands = new Set(["install", "exec", "build", "lint", "outdated", "audit"]);
const textExtensions = new Set([".md"]);
const docsHealthTargets = ["README.md", "AGENTS.md", "docs", ".agents"];

const canonicalDocs = [
  "README.md",
  "docs/fork-launch-runbook.md",
  "docs/fork-upgrade-runbook.md",
  "docs/configuration.md",
  "docs/conventions.md",
  "docs/repository-settings.md",
  "docs/supabase.md",
  "docs/readiness-checklist.md",
  "docs/optimization-options.md",
  "docs/roadmap.md",
];

const staleCurrentStatePhrases = [
  "Cloudflare DNS still needs",
  "HTTPS enforcement is still waiting",
  "public visibility and forkability remain blocked",
  "private-repository fork enabling currently return",
  "Browser Use could not attach",
];

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function collectMarkdownFiles(targets = docsHealthTargets) {
  const files = [];

  async function visit(absolutePath) {
    let info;
    try {
      info = await stat(absolutePath);
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }

    if (info.isDirectory()) {
      for (const entry of await readdir(absolutePath)) {
        await visit(path.join(absolutePath, entry));
      }
      return;
    }

    if (info.isFile() && textExtensions.has(path.extname(absolutePath).toLowerCase())) {
      files.push({
        absolutePath,
        relativePath: normalizePath(path.relative(root, absolutePath)),
      });
    }
  }

  for (const target of targets) {
    await visit(path.join(root, target));
  }

  return files.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function requireIncludes(content, phrase, label) {
  if (!content.includes(phrase)) {
    throw new Error(`${label} is missing required phrase: ${phrase}`);
  }
}

function extractMarkdownPnpmScripts(content) {
  const scripts = new Set();
  const candidates = [];

  for (const match of content.matchAll(/`([^`]*\bpnpm\s+[^`]+)`/g)) {
    candidates.push(match[1].trim());
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.includes("pnpm ")) {
      candidates.push(trimmed);
    }
  }

  for (const candidate of candidates) {
    if (candidate.includes("*")) continue;

    const normalized = candidate
      .replace(/^(?:[A-Z_][A-Z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s]+)\s+)*/, "")
      .replace(/^-\s+(?:\[[ xX]\]\s+)?/, "")
      .replace(/^`|`$/g, "")
      .trim();
    const match = normalized.match(/^pnpm\s+([^\s`]+)/);
    if (match) {
      scripts.add(match[1]);
    }
  }

  return scripts;
}

export function findMissingDocumentedScripts({ files, packageJson }) {
  const packageScripts = new Set(Object.keys(JSON.parse(packageJson).scripts || {}));
  const missing = [];

  for (const file of files) {
    for (const scriptName of extractMarkdownPnpmScripts(file.content)) {
      if (allowedNonScriptCommands.has(scriptName) || packageScripts.has(scriptName)) {
        continue;
      }
      missing.push(`${file.relativePath}: pnpm ${scriptName}`);
    }
  }

  return missing.sort();
}

export function checkDocsHealthContent({
  packageJson,
  readme,
  conventions,
  roadmap,
  optimizationOptions,
  configuration,
  forkContentStrategy,
  forking,
  openSourceRelease,
  repositorySettings,
  supabase,
  publicLaunch,
  allDocsText,
  documentedFiles = [],
}) {
  for (const docPath of canonicalDocs) {
    requireIncludes(conventions, docPath, "docs/conventions.md");
  }

  requireIncludes(conventions, "Docs Source Of Truth", "docs/conventions.md");
  requireIncludes(readme, "Fork launch", "README.md");
  requireIncludes(readme, "Fork upgrades", "README.md");

  requireIncludes(roadmap, "Multilingual UI", "docs/roadmap.md");
  requireIncludes(roadmap, "app.defaultLocale", "docs/roadmap.md");
  requireIncludes(roadmap, "app.locales", "docs/roadmap.md");
  requireIncludes(roadmap, "German", "docs/roadmap.md");
  requireIncludes(optimizationOptions, "Multilingual UI", "docs/optimization-options.md");
  requireIncludes(optimizationOptions, "docs/roadmap.md", "docs/optimization-options.md");

  requireIncludes(configuration, "locale metadata", "docs/configuration.md");
  requireIncludes(configuration, "does not mean the full user-facing UI is translated", "docs/configuration.md");
  requireIncludes(forkContentStrategy, "Current shipped content is English-only", "docs/fork-content-strategy.md");
  requireIncludes(forkContentStrategy, "Target multilingual direction", "docs/fork-content-strategy.md");

  for (const [label, content] of [
    ["docs/forking.md", forking],
    ["docs/open-source-release.md", openSourceRelease],
    ["docs/repository-settings.md", repositorySettings],
    ["docs/supabase.md", supabase],
  ]) {
    requireIncludes(content, "fork-launch-runbook.md", label);
  }

  requireIncludes(forking, "fork-upgrade-runbook.md", "docs/forking.md");
  requireIncludes(openSourceRelease, "fork-upgrade-runbook.md", "docs/open-source-release.md");
  requireIncludes(publicLaunch, "upstream worked example", "docs/public-launch-runbook.md");
  requireIncludes(repositorySettings, "https_enforced=true", "docs/repository-settings.md");

  for (const stalePhrase of staleCurrentStatePhrases) {
    if (allDocsText.includes(stalePhrase)) {
      throw new Error(`Documentation contains stale current-state phrase: ${stalePhrase}`);
    }
  }

  const missingScripts = findMissingDocumentedScripts({ files: documentedFiles, packageJson });
  if (missingScripts.length > 0) {
    throw new Error(`Documented pnpm command(s) do not exist in package.json: ${missingScripts.join(", ")}`);
  }
}

export async function main() {
  const files = await collectMarkdownFiles();
  const fileMap = new Map();

  for (const file of files) {
    fileMap.set(file.relativePath, {
      ...file,
      content: await readFile(file.absolutePath, "utf8"),
    });
  }

  const docsDir = path.join(root, "docs");
  const missingFromIndex = await findMissingDocsIndexLinks({ docsDir });
  const missingFromArtifacts = await findMissingGeneratedDocsArtifacts({
    docsDir,
    manifestPath: path.join(root, "public", "content", "generated", "docs", "index.json"),
  });

  if (missingFromIndex.length > 0 || missingFromArtifacts.length > 0) {
    throw new Error("Docs index or generated docs artifacts are missing top-level docs.");
  }

  checkDocsHealthContent({
    packageJson: await readFile(path.join(root, "package.json"), "utf8"),
    readme: fileMap.get("README.md")?.content || "",
    conventions: fileMap.get("docs/conventions.md")?.content || "",
    roadmap: fileMap.get("docs/roadmap.md")?.content || "",
    optimizationOptions: fileMap.get("docs/optimization-options.md")?.content || "",
    configuration: fileMap.get("docs/configuration.md")?.content || "",
    forkContentStrategy: fileMap.get("docs/fork-content-strategy.md")?.content || "",
    forking: fileMap.get("docs/forking.md")?.content || "",
    openSourceRelease: fileMap.get("docs/open-source-release.md")?.content || "",
    repositorySettings: fileMap.get("docs/repository-settings.md")?.content || "",
    supabase: fileMap.get("docs/supabase.md")?.content || "",
    publicLaunch: fileMap.get("docs/public-launch-runbook.md")?.content || "",
    allDocsText: [...fileMap.values()].map((file) => file.content).join("\n"),
    documentedFiles: [...fileMap.values()],
  });

  console.log("Docs health check passed.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
