import assert from "node:assert/strict";
import test from "node:test";

import {
  checkAgentsContract,
  parseSkillFrontmatter,
} from "./check-agents.mjs";

const requiredFiles = [
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

test("parses skill frontmatter", () => {
  const frontmatter = parseSkillFrontmatter(`---
name: example-skill
description: Use when testing.
---

# Example
`);

  assert.deepEqual(frontmatter, {
    name: "example-skill",
    description: "Use when testing.",
  });
});

test("accepts the expected agent source-of-truth contract", () => {
  const files = new Map([
    ["AGENTS.md", `
Read .agents/workflows/session-start.md.
Read .agents/workflows/goal-mode-preflight.md.
Read .agents/workflows/finishing-work.md and .agents/workflows/quality-loop.md.
Use .agents/skills/hyperoptimum-stewardship/.
`],
    ...requiredFiles.map((file) => [
      file,
      file.endsWith("/SKILL.md")
        ? `---\nname: ${file.split("/").at(-2)}\ndescription: Use when relevant.\n---\n# Skill\n`
        : "# File\n",
    ]),
  ]);

  assert.doesNotThrow(() => checkAgentsContract({
    files,
    legacyAgentDirectoryExists: false,
  }));
});

test("rejects missing required agent files", () => {
  const files = new Map([[
    "AGENTS.md",
    `
.agents/workflows/session-start.md
.agents/workflows/goal-mode-preflight.md
.agents/workflows/finishing-work.md
.agents/workflows/quality-loop.md
.agents/skills/hyperoptimum-stewardship/
`,
  ], ...requiredFiles
    .filter((file) => file !== ".agents/rules/privacy-and-supabase.md")
    .map((file) => [
      file,
      file.endsWith("/SKILL.md")
        ? `---\nname: ${file.split("/").at(-2)}\ndescription: Use when relevant.\n---\n# Skill\n`
        : "# File\n",
    ])]);

  assert.throws(
    () => checkAgentsContract({ files, legacyAgentDirectoryExists: false }),
    /missing required agent file.*privacy-and-supabase/s,
  );
});

test("rejects legacy .agent directory and incomplete skill metadata", () => {
  const files = new Map([
    ["AGENTS.md", `
.agents/workflows/session-start.md
.agents/workflows/goal-mode-preflight.md
.agents/workflows/finishing-work.md
.agents/workflows/quality-loop.md
.agents/skills/hyperoptimum-stewardship/
`],
    ...requiredFiles.map((file) => [
      file,
      file.endsWith("/SKILL.md") ? "---\nname: missing-description\n---\n# Skill\n" : "# File\n",
    ]),
  ]);

  assert.throws(
    () => checkAgentsContract({ files, legacyAgentDirectoryExists: true }),
    /Legacy .agent directory must not exist/,
  );
  assert.throws(
    () => checkAgentsContract({ files, legacyAgentDirectoryExists: false }),
    /missing description/,
  );
});
