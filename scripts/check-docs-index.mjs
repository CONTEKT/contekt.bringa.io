/**
 * Verifies top-level docs are linked from the docs index and generated docs artifacts exist.
 *
 * Source of truth: `docs/*.md` and generated public docs content.
 * Side effects: None beyond CLI output and exit status.
 *
 * @module scripts/check-docs-index
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function topLevelDocs(docsDir) {
  const entries = await readdir(docsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => entry.name)
    .sort();
}

export async function findMissingDocsIndexLinks({ docsDir }) {
  const docs = await topLevelDocs(docsDir);

  const indexText = await readFile(path.join(docsDir, "index.md"), "utf8");
  const linkedDocs = new Set(
    [...indexText.matchAll(/\]\(([^)#?]+\.md)(?:[#?][^)]*)?\)/g)]
      .map((match) => path.basename(match[1]))
      .filter((name) => name !== "index.md"),
  );

  return docs.filter((doc) => !linkedDocs.has(doc));
}

export async function findMissingGeneratedDocsArtifacts({ docsDir, manifestPath }) {
  const docs = await topLevelDocs(docsDir);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const linkedDocs = new Set((manifest.docs || []).map((doc) => `${doc.slug}.md`));

  return docs.filter((doc) => !linkedDocs.has(doc));
}

async function main() {
  const docsDir = path.join(process.cwd(), "docs");
  const manifestPath = path.join(process.cwd(), "public", "content", "generated", "docs", "index.json");
  const missingFromIndex = await findMissingDocsIndexLinks({ docsDir });
  const missingFromArtifacts = await findMissingGeneratedDocsArtifacts({ docsDir, manifestPath });

  if (missingFromIndex.length > 0 || missingFromArtifacts.length > 0) {
    if (missingFromIndex.length > 0) {
      console.error(`docs/index.md is missing links to: ${missingFromIndex.join(", ")}`);
    }
    if (missingFromArtifacts.length > 0) {
      console.error(`Generated in-app docs manifest is missing: ${missingFromArtifacts.join(", ")}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Docs index and generated app docs checks passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
