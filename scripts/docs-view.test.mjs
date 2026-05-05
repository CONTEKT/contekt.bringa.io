import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDocsPageHref,
  resolveDocsSelection,
  rewriteDocsMarkdownHref,
} from "../src/lib/docs-view.ts";

const docs = [
  { slug: "index", title: "Docs", path: "/content/generated/docs/index.md", sourcePath: "docs/index.md" },
  { slug: "configuration", title: "Configuration", path: "/content/generated/docs/configuration.md", sourcePath: "docs/configuration.md" },
];

test("builds app docs hrefs from slugs", () => {
  assert.equal(buildDocsPageHref("index"), "/docs");
  assert.equal(buildDocsPageHref("configuration"), "/docs?doc=configuration");
});

test("resolves docs selection with index fallback", () => {
  assert.deepEqual(resolveDocsSelection({ docs, requestedSlug: "configuration" }), docs[1]);
  assert.deepEqual(resolveDocsSelection({ docs, requestedSlug: "missing" }), docs[0]);
  assert.equal(resolveDocsSelection({ docs: [], requestedSlug: "configuration" }), null);
});

test("rewrites internal markdown links to app docs links", () => {
  assert.equal(rewriteDocsMarkdownHref("configuration.md"), "/docs?doc=configuration");
  assert.equal(rewriteDocsMarkdownHref("./configuration.md#fields"), "/docs?doc=configuration#fields");
  assert.equal(rewriteDocsMarkdownHref("https://example.com"), "https://example.com");
  assert.equal(rewriteDocsMarkdownHref("#top"), "#top");
});
