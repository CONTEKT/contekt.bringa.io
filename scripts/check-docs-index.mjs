import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function findMissingDocsIndexLinks({ docsDir }) {
  const entries = await readdir(docsDir, { withFileTypes: true });
  const docs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "index.md")
    .map((entry) => entry.name)
    .sort();

  const indexText = await readFile(path.join(docsDir, "index.md"), "utf8");
  const linkedDocs = new Set(
    [...indexText.matchAll(/\]\(([^)#?]+\.md)(?:[#?][^)]*)?\)/g)]
      .map((match) => path.basename(match[1]))
      .filter((name) => name !== "index.md"),
  );

  return docs.filter((doc) => !linkedDocs.has(doc));
}

async function main() {
  const docsDir = path.join(process.cwd(), "docs");
  const missing = await findMissingDocsIndexLinks({ docsDir });

  if (missing.length > 0) {
    console.error(`docs/index.md is missing links to: ${missing.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("Docs index check passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
