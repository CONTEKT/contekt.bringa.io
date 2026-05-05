import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { Writable } from "node:stream";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildOperatorSetupChecklist,
  createOperatorSetupFromAnswers,
  resolveOperatorSetupAnswers,
} from "./setup-operator.mjs";

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

test("resolves operator setup answers with safe defaults", () => {
  const answers = resolveOperatorSetupAnswers({
    slug: " share.example.org ",
    githubOwner: "",
    githubRepo: "",
    operatorName: "",
    canonicalUrl: "",
    supabaseUrl: "",
    supabasePublishableKey: "",
    useDeployBranch: "",
  }, {
    GITHUB_REPOSITORY: "example/sharing-app",
  });

  assert.deepEqual(answers, {
    slug: "share.example.org",
    githubOwner: "example",
    githubRepo: "sharing-app",
    operatorName: "share.example.org",
    canonicalUrl: "https://share.example.org",
    supabaseUrl: "https://replace-with-your-project-ref.supabase.co",
    supabasePublishableKey: "replace-with-your-public-publishable-key",
    useDeployBranch: true,
  });
});

test("builds a concrete first-run checklist", () => {
  const checklist = buildOperatorSetupChecklist({
    slug: "share.example.org",
    useDeployBranch: true,
  });

  assert.match(checklist.join("\n"), /git switch -c deploy\/share\.example\.org/);
  assert.match(checklist.join("\n"), /BRINGA_DEPLOYMENT=share\.example\.org pnpm generate:config/);
  assert.match(checklist.join("\n"), /Supabase Auth Site URL/);
  assert.doesNotMatch(checklist.join("\n"), /service role/i);
});

test("creates an operator deployment profile from setup answers", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "bringa-operator-setup-"));
  t.after(() => rm(root, { recursive: true, force: true }));

  const output = captureOutput();
  const result = await createOperatorSetupFromAnswers({
    root,
    rawAnswers: {
      slug: "share.example.org",
      githubOwner: "",
      githubRepo: "",
      operatorName: "Share Example",
      canonicalUrl: "",
      supabaseUrl: "https://abc.supabase.co",
      supabasePublishableKey: "public-publishable-key",
      useDeployBranch: "n",
    },
    output: output.stream,
    env: {
      GITHUB_REPOSITORY: "example/sharing-app",
    },
  });

  assert.equal(result.slug, "share.example.org");
  assert.equal(result.useDeployBranch, false);
  assert.match(output.text(), /Created config\/deployments\/share\.example\.org\.jsonc/);
  assert.match(output.text(), /Run pnpm build/);

  const profile = await readFile(result.filePath, "utf8");
  assert.match(profile, /"owner": "example"/);
  assert.match(profile, /"name": "sharing-app"/);
  assert.match(profile, /"organizationName": "Share Example"/);
  assert.match(profile, /"url": "https:\/\/abc\.supabase\.co"/);
  assert.match(profile, /"publishableKey": "public-publishable-key"/);
});
