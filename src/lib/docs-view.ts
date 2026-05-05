export type DocsManifestEntry = {
  slug: string;
  title: string;
  path: string;
  sourcePath: string;
};

export function buildDocsPageHref(slug: string): string {
  return slug === "index" ? "/docs" : `/docs?doc=${encodeURIComponent(slug)}`;
}

export function resolveDocsSelection({
  docs,
  requestedSlug,
}: {
  docs: DocsManifestEntry[];
  requestedSlug: string | null;
}): DocsManifestEntry | null {
  if (docs.length === 0) {
    return null;
  }

  return docs.find((doc) => doc.slug === requestedSlug) ?? docs.find((doc) => doc.slug === "index") ?? docs[0];
}

export function rewriteDocsMarkdownHref(href: string | undefined): string | undefined {
  if (!href || href.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return href;
  }

  const normalized = href.replace(/^\.\//, "");
  const [withoutHash, hash = ""] = normalized.split("#");

  if (!withoutHash.endsWith(".md") || withoutHash.includes("/")) {
    return href;
  }

  const slug = withoutHash.replace(/\.md$/, "");
  return `${buildDocsPageHref(slug)}${hash ? `#${hash}` : ""}`;
}
