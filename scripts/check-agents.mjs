import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredAgentFiles = [
  ".agents/rules/core.md",
  ".agents/rules/privacy-and-supabase.md",
  ".agents/rules/source-of-truth.md",
  ".agents/workflows/session-start.md",
  ".agents/workflows/goal-mode-preflight.md",
  ".agents/workflows/finishing-work.md",
  ".agents/workflows/quality-loop.md",
  ".agents/skills/hyperoptimum-stewardship/SKILL.md",
  ".agents/skills/supabase-mcp/SKILL.md",
  ".agents/skills/agentic-browser-testing/SKILL.md",
];

const requiredAgentsReferences = [
  ".agents/workflows/session-start.md",
  ".agents/workflows/goal-mode-preflight.md",
  ".agents/workflows/finishing-work.md",
  ".agents/workflows/quality-loop.md",
  ".agents/skills/hyperoptimum-stewardship/",
];

function assertIncludes(content, value, label) {
  if (!content.includes(value)) {
    throw new Error(`${label} is missing required reference: ${value}`);
  }
}

async function pathExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function collectSkillFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const skillPath = path.join(entryPath, "SKILL.md");
      if (await pathExists(skillPath)) {
        files.push(path.relative(root, skillPath));
      }
    }
  }

  return files.sort();
}

export function parseSkillFrontmatter(content) {
  const match = content.match(/^---\n(?<body>[\s\S]*?)\n---/);
  if (!match) return {};

  const entries = {};
  for (const line of match.groups.body.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) entries[key] = value;
  }

  return entries;
}

export function checkAgentsContract({ files, legacyAgentDirectoryExists }) {
  if (legacyAgentDirectoryExists) {
    throw new Error("Legacy .agent directory must not exist; .agents/ is the source of truth.");
  }

  const agents = files.get("AGENTS.md") || "";
  for (const reference of requiredAgentsReferences) {
    assertIncludes(agents, reference, "AGENTS.md");
  }

  for (const filePath of requiredAgentFiles) {
    if (!files.has(filePath)) {
      throw new Error(`missing required agent file: ${filePath}`);
    }
  }

  for (const [filePath, content] of files) {
    if (!filePath.startsWith(".agents/skills/") || !filePath.endsWith("/SKILL.md")) {
      continue;
    }

    const frontmatter = parseSkillFrontmatter(content);
    if (!frontmatter.name) {
      throw new Error(`${filePath} is missing name frontmatter.`);
    }
    if (!frontmatter.description) {
      throw new Error(`${filePath} is missing description frontmatter.`);
    }
  }
}

export async function main() {
  const files = new Map();
  files.set("AGENTS.md", await readFile(path.join(root, "AGENTS.md"), "utf8"));

  for (const filePath of requiredAgentFiles) {
    files.set(filePath, await readFile(path.join(root, filePath), "utf8"));
  }

  for (const filePath of await collectSkillFiles(path.join(root, ".agents", "skills"))) {
    if (!files.has(filePath)) {
      files.set(filePath, await readFile(path.join(root, filePath), "utf8"));
    }
  }

  checkAgentsContract({
    files,
    legacyAgentDirectoryExists: await pathExists(path.join(root, ".agent")),
  });

  console.log("Agent source-of-truth check passed.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
