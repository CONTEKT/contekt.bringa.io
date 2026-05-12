import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { checkProductionBundle } from "./check-production-bundle.mjs";

async function withFixture(files, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-production-bundle-"));

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

test("accepts production static chunks without local demo fixture markers", async () => {
  await withFixture(
    {
      "out/_next/static/chunks/app.js": "console.log('production app');\n",
    },
    async (root) => {
      assert.deepEqual(await checkProductionBundle({ root }), []);
    },
  );
});

test("reports local demo fixture markers in production static chunks", async () => {
  await withFixture(
    {
      "out/_next/static/chunks/app.js": "const item = 'demo-desk-lamp';\n",
      "out/_next/static/chunks/auth.js": "const token = 'local-demo-access-token';\n",
    },
    async (root) => {
      assert.deepEqual(await checkProductionBundle({ root }), [
        "out/_next/static/chunks/app.js contains development-only local demo marker: demo-desk-lamp",
        "out/_next/static/chunks/auth.js contains development-only local demo marker: local-demo-access-token",
      ]);
    },
  );
});

test("reports local Supabase email login fixture markers in production static chunks", async () => {
  await withFixture(
    {
      "out/_next/static/chunks/login.js": "const email = 'admin@bringa.local'; const password = 'bringa-local-admin-123';\n",
    },
    async (root) => {
      assert.deepEqual(await checkProductionBundle({ root }), [
        "out/_next/static/chunks/login.js contains development-only local demo marker: admin@bringa.local",
        "out/_next/static/chunks/login.js contains development-only local demo marker: bringa-local-admin-123",
      ]);
    },
  );
});

test("requires a production build before checking bundle output", async () => {
  await withFixture(
    {
      "package.json": "{}\n",
    },
    async (root) => {
      assert.deepEqual(await checkProductionBundle({ root }), [
        "Production static assets are missing. Run `pnpm build` before `pnpm check:production-bundle`.",
      ]);
    },
  );
});
