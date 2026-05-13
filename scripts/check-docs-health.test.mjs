import assert from "node:assert/strict";
import test from "node:test";

import {
  checkDocsHealthContent,
  findMissingDocumentedScripts,
} from "./check-docs-health.mjs";

const validPackageJson = JSON.stringify({
  scripts: {
    "check:config": "node scripts/generate-config.mjs --check",
    "setup:operator": "node scripts/setup-operator.mjs",
    "check:docs-health": "node scripts/check-docs-health.mjs",
  },
});

function validDocs(overrides = {}) {
  return {
    packageJson: validPackageJson,
    readme: "Fork launch and Fork upgrades are linked.",
    conventions: `
## Docs Source Of Truth
- README.md
- docs/fork-launch-runbook.md
- docs/fork-upgrade-runbook.md
- docs/configuration.md
- docs/conventions.md
- docs/repository-settings.md
- docs/supabase.md
- docs/readiness-checklist.md
- docs/optimization-options.md
- docs/roadmap.md
`,
    roadmap: "## Next Product Work\n- Multilingual UI: use app.defaultLocale and app.locales, start with German.",
    optimizationOptions: "- Multilingual UI execution: see docs/roadmap.md. Impact: fork readiness.",
    configuration: "app.locales is locale metadata and does not mean the full user-facing UI is translated.",
    forkContentStrategy: "Current shipped content is English-only. Target multilingual direction.",
    forking: "Use fork-launch-runbook.md and fork-upgrade-runbook.md.",
    openSourceRelease: "Use fork-launch-runbook.md and fork-upgrade-runbook.md.",
    repositorySettings: "Use fork-launch-runbook.md. Current Pages state includes https_enforced=true.",
    supabase: "Use fork-launch-runbook.md.",
    publicLaunch: "This is the upstream worked example.",
    allDocsText: "No stale phrases.",
    documentedFiles: [
      { relativePath: "docs/example.md", content: "`pnpm check:config`\nBRINGA_DEPLOYMENT=x pnpm setup:operator" },
    ],
    ...overrides,
  };
}

test("accepts healthy docs source-of-truth content", () => {
  assert.doesNotThrow(() => checkDocsHealthContent(validDocs()));
});

test("rejects missing multilingual roadmap language", () => {
  assert.throws(
    () => checkDocsHealthContent(validDocs({ roadmap: "## Next Product Work\n- Search polish." })),
    /docs\/roadmap\.md.*Multilingual UI/s,
  );
});

test("rejects stale current-state phrases", () => {
  assert.throws(
    () => checkDocsHealthContent(validDocs({ allDocsText: "Cloudflare DNS still needs an app CNAME." })),
    /stale current-state phrase/s,
  );
});

test("finds documented pnpm commands without package scripts", () => {
  const missing = findMissingDocumentedScripts({
    packageJson: JSON.stringify({ scripts: { "check:config": "node check.mjs" } }),
    files: [
      { relativePath: "docs/test.md", content: "`pnpm check:config`\n`pnpm check:missing`\n`pnpm exec supabase status`" },
    ],
  });

  assert.deepEqual(missing, ["docs/test.md: pnpm check:missing"]);
});

test("allows documented built-in pnpm commands", () => {
  const missing = findMissingDocumentedScripts({
    packageJson: JSON.stringify({ scripts: {} }),
    files: [
      { relativePath: "docs/test.md", content: "`pnpm install`\n`pnpm build`\n`pnpm lint`\n`pnpm outdated`\n`pnpm audit --prod`" },
    ],
  });

  assert.deepEqual(missing, []);
});

test("ignores wildcard documented pnpm command families", () => {
  const missing = findMissingDocumentedScripts({
    packageJson: JSON.stringify({ scripts: {} }),
    files: [{ relativePath: "docs/test.md", content: "`pnpm check:*`\n`pnpm test:*`" }],
  });

  assert.deepEqual(missing, []);
});
