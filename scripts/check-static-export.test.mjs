import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkStaticExportContract } from "./check-static-export.mjs";

async function withFixture(files, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-static-export-"));

  try {
    for (const [filePath, content] of Object.entries(files)) {
      const absolutePath = path.join(root, filePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    }

    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("accepts export output, unoptimized images, and force-static route handlers", async () => {
  await withFixture(
    {
      "next.config.ts": "export default { output: 'export', images: { unoptimized: true } };\n",
      "src/app/manifest/route.ts": "export const dynamic = 'force-static';\nexport function GET() {}\n",
    },
    async (root) => {
      assert.deepEqual(await checkStaticExportContract({ root }), []);
    },
  );
});

test("reports config and unsupported app-router server surfaces", async () => {
  await withFixture(
    {
      "next.config.ts": "export default { images: {} };\n",
      "middleware.ts": "export function middleware() {}\n",
      "src/app/api/route.ts": "export function POST() {}\n",
    },
    async (root) => {
      assert.deepEqual(await checkStaticExportContract({ root }), [
        "next.config.ts must set output: 'export'.",
        "next.config.ts must set images.unoptimized: true for static export image usage.",
        "middleware.ts is not supported by static export.",
        "src/app/api/route.ts must export dynamic = 'force-static' for static export.",
      ]);
    },
  );
});

test("reports webpack customization without explicit top-level turbopack config", async () => {
  await withFixture(
    {
      "next.config.ts": "export default { output: 'export', images: { unoptimized: true }, webpack: (config) => config };\n",
    },
    async (root) => {
      assert.deepEqual(await checkStaticExportContract({ root }), [
        "next.config.ts must set top-level turbopack config when webpack is customized so Next 16 dev/build defaults stay explicit.",
      ]);
    },
  );
});
