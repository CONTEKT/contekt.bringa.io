import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const routeFilePattern = /^route\.(js|jsx|mjs|ts|tsx)$/;

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

async function collectRouteFiles(appRoot) {
  const routeFiles = [];

  async function visit(absolutePath) {
    let info;
    try {
      info = await stat(absolutePath);
    } catch (error) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }

    if (info.isDirectory()) {
      const entries = await readdir(absolutePath);
      for (const entry of entries) {
        await visit(path.join(absolutePath, entry));
      }
      return;
    }

    if (info.isFile() && routeFilePattern.test(path.basename(absolutePath))) {
      routeFiles.push(absolutePath);
    }
  }

  await visit(appRoot);
  return routeFiles.sort((a, b) => a.localeCompare(b));
}

export async function checkStaticExportContract({ root } = {}) {
  const scanRoot = root || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const errors = [];
  const nextConfigPath = path.join(scanRoot, "next.config.ts");

  if (!(await pathExists(nextConfigPath))) {
    errors.push("next.config.ts is required for the static export contract.");
  } else {
    const nextConfig = await readFile(nextConfigPath, "utf8");
    if (!/output\s*:\s*['"]export['"]/.test(nextConfig)) {
      errors.push("next.config.ts must set output: 'export'.");
    }
    if (!/images\s*:\s*{[\s\S]*?unoptimized\s*:\s*true/.test(nextConfig)) {
      errors.push("next.config.ts must set images.unoptimized: true for static export image usage.");
    }
  }

  for (const middlewarePath of ["middleware.ts", "middleware.js"]) {
    if (await pathExists(path.join(scanRoot, middlewarePath))) {
      errors.push(`${middlewarePath} is not supported by static export.`);
    }
  }

  for (const routeFile of await collectRouteFiles(path.join(scanRoot, "src", "app"))) {
    const routeContent = await readFile(routeFile, "utf8");
    if (!/dynamic\s*=\s*['"]force-static['"]/.test(routeContent)) {
      errors.push(`${normalizeRelativePath(path.relative(scanRoot, routeFile))} must export dynamic = 'force-static' for static export.`);
    }
  }

  return errors;
}

async function main() {
  const errors = await checkStaticExportContract({ root });

  if (errors.length === 0) {
    console.log("Static export check passed.");
    return;
  }

  console.error("Static export contract check failed:");
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
