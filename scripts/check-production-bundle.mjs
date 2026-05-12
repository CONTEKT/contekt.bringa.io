/**
 * Checks generated production chunks for development-only local demo markers.
 *
 * Source of truth: Next.js build output and the marker list in this script.
 * Side effects: None beyond CLI output and exit status.
 *
 * @module scripts/check-production-bundle
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const developmentOnlyBundleMarkers = [
  "demo-desk-lamp",
  "local-demo-access-token",
  "local.demo@app.bringa.io",
  "admin@bringa.local",
  "bringa-local-admin-123",
  "member@bringa.local",
  "bringa-local-member-123",
];

function normalizeRelativePath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function collectJavaScriptFiles(directory) {
  const files = [];

  async function visit(absolutePath) {
    const info = await stat(absolutePath);

    if (info.isDirectory()) {
      const entries = await readdir(absolutePath);
      for (const entry of entries) {
        await visit(path.join(absolutePath, entry));
      }
      return;
    }

    if (info.isFile() && absolutePath.endsWith(".js")) {
      files.push(absolutePath);
    }
  }

  await visit(directory);
  return files.sort((left, right) => left.localeCompare(right));
}

export async function checkProductionBundle({ root } = {}) {
  const scanRoot = root || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const staticRoot = path.join(scanRoot, "out", "_next", "static");
  const errors = [];

  if (!(await pathExists(staticRoot))) {
    return ["Production static assets are missing. Run `pnpm build` before `pnpm check:production-bundle`."];
  }

  const files = await collectJavaScriptFiles(staticRoot);
  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    for (const marker of developmentOnlyBundleMarkers) {
      if (content.includes(marker)) {
        errors.push(
          `${normalizeRelativePath(path.relative(scanRoot, filePath))} contains development-only local demo marker: ${marker}`,
        );
      }
    }
  }

  return errors;
}

async function main() {
  const errors = await checkProductionBundle({ root });

  if (errors.length === 0) {
    console.log("Production bundle check passed.");
    return;
  }

  console.error("Production bundle check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
