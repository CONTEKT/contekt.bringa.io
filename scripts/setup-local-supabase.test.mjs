import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { Writable } from "node:stream";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildLocalConfigContent,
  resolveLocalPublicSupabaseConfig,
  setupLocalSupabase,
} from "./setup-local-supabase.mjs";

function captureOutput() {
  let output = "";
  return {
    stream: new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    }),
    text() {
      return output;
    },
  };
}

test("resolves local public Supabase values from status output", () => {
  const config = resolveLocalPublicSupabaseConfig({
    statusEnv: new Map([
      ["API_URL", "http://127.0.0.1:54321"],
      ["SUPABASE_ANON_KEY", "local-anon-key"],
    ]),
  });

  assert.deepEqual(config, {
    supabase: {
      url: "http://127.0.0.1:54321",
      publishableKey: "local-anon-key",
    },
    development: {
      localDemoMode: false,
    },
  });
});

test("refuses remote Supabase URLs", () => {
  assert.throws(
    () => resolveLocalPublicSupabaseConfig({
      env: {
        BRINGA_LOCAL_SUPABASE_URL: "https://example.supabase.co",
        BRINGA_LOCAL_SUPABASE_PUBLISHABLE_KEY: "public-key",
      },
    }),
    /non-local Supabase URL/,
  );
});

test("refuses Supabase secret keys in public local config", () => {
  assert.throws(
    () => resolveLocalPublicSupabaseConfig({
      env: {
        BRINGA_LOCAL_SUPABASE_URL: "http://127.0.0.1:54321",
        BRINGA_LOCAL_SUPABASE_PUBLISHABLE_KEY: "sb_secret_example",
      },
    }),
    /secret key/,
  );
});

test("builds minimal local config content without secrets", () => {
  const content = buildLocalConfigContent({
    supabase: {
      url: "http://127.0.0.1:54321",
      publishableKey: "local-public-key",
    },
  });

  assert.match(content, /"url": "http:\/\/127\.0\.0\.1:54321"/);
  assert.match(content, /"publishableKey": "local-public-key"/);
  assert.match(content, /"localDemoMode": false/);
  assert.doesNotMatch(content, /secret/i);
  assert.doesNotMatch(content, /service/i);
});

test("writes config/local.config.jsonc from local status values", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-local-supabase-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const output = captureOutput();
  const result = await setupLocalSupabase({
    root,
    output: output.stream,
    statusEnv: new Map([
      ["SUPABASE_URL", "http://127.0.0.1:54321"],
      ["SUPABASE_PUBLISHABLE_KEY", "sb_publishable_local"],
    ]),
  });

  assert.equal(result.seeded, false);
  assert.match(output.text(), /Wrote config\/local\.config\.jsonc/);

  const config = await readFile(path.join(root, "config", "local.config.jsonc"), "utf8");
  assert.match(config, /"publishableKey": "sb_publishable_local"/);
  assert.match(config, /"localDemoMode": false/);
});

test("dry run does not write local config", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-local-supabase-dry-run-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const output = captureOutput();
  await setupLocalSupabase({
    root,
    dryRun: true,
    output: output.stream,
    statusEnv: new Map([
      ["SUPABASE_URL", "http://127.0.0.1:54321"],
      ["PUBLISHABLE_KEY", "local-public-key"],
    ]),
  });

  assert.match(output.text(), /Dry run: would write config\/local\.config\.jsonc/);
  await assert.rejects(() => access(path.join(root, "config", "local.config.jsonc")), /ENOENT/);
});

test("refuses to replace existing local config unless forced", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-local-supabase-existing-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const configPath = path.join(root, "config", "local.config.jsonc");
  await mkdir(path.dirname(configPath), { recursive: true });
  await writeFile(configPath, "{\"development\":{\"localDemoMode\":true}}\n", "utf8");

  await assert.rejects(
    () => setupLocalSupabase({
      root,
      statusEnv: new Map([
        ["SUPABASE_URL", "http://127.0.0.1:54321"],
        ["ANON_KEY", "local-public-key"],
      ]),
    }),
    /already exists/,
  );
});
