import assert from "node:assert/strict";
import test from "node:test";

import { checkWorkflowContent, extractWorkflowTriggers } from "./check-github-workflows.mjs";

test("extracts manual workflow triggers from block syntax", () => {
  const triggers = extractWorkflowTriggers(`name: CI

on:
  workflow_dispatch:

jobs:
  quality:
    runs-on: ubuntu-latest
`);

  assert.deepEqual([...triggers], ["workflow_dispatch"]);
});

test("rejects push triggers in workflow blocks", () => {
  assert.throws(
    () => checkWorkflowContent(".github/workflows/ci.yml", `name: CI
on:
  workflow_dispatch:
  push:
`),
    /must stay manual-only.*push/s,
  );
});

test("rejects inline arrays with non-manual triggers", () => {
  assert.throws(
    () => checkWorkflowContent(".github/workflows/docs.yml", "on: [workflow_dispatch, pull_request]"),
    /must stay manual-only.*pull_request/s,
  );
});

test("requires workflow_dispatch for every workflow", () => {
  assert.throws(
    () => checkWorkflowContent(".github/workflows/nightly.yml", `on:
  schedule:
    - cron: "0 0 * * *"
`),
    /must include workflow_dispatch/,
  );
});
