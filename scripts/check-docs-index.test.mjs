import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { findMissingDocsIndexLinks, findMissingGeneratedDocsArtifacts } from "./check-docs-index.mjs";

async function writeDoc(root, name, content = "---\ntitle: Test\n---\n\n# Test\n") {
  await writeFile(path.join(root, name), content);
}

test("reports top-level docs missing from docs/index.md", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-docs-index-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  await mkdir(root, { recursive: true });
  await writeDoc(root, "index.md", "- [Listed](listed.md)\n");
  await writeDoc(root, "listed.md");
  await writeDoc(root, "missing.md");

  const missing = await findMissingDocsIndexLinks({ docsDir: root });

  assert.deepEqual(missing, ["missing.md"]);
});

test("reports top-level docs missing from generated app docs artifacts", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-docs-artifacts-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const manifestPath = path.join(root, "generated", "index.json");
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeDoc(root, "index.md");
  await writeDoc(root, "listed.md");
  await writeDoc(root, "missing.md");
  await writeFile(manifestPath, JSON.stringify({ docs: [{ slug: "listed" }] }));

  const missing = await findMissingGeneratedDocsArtifacts({ docsDir: root, manifestPath });

  assert.deepEqual(missing, ["missing.md"]);
});

test("accepts the current repository docs index", async () => {
  const missing = await findMissingDocsIndexLinks({ docsDir: path.join(process.cwd(), "docs") });

  assert.deepEqual(missing, []);
});

test("accepts the current generated app docs manifest", async () => {
  const missing = await findMissingGeneratedDocsArtifacts({
    docsDir: path.join(process.cwd(), "docs"),
    manifestPath: path.join(process.cwd(), "public", "content", "generated", "docs", "index.json"),
  });

  assert.deepEqual(missing, []);
});
