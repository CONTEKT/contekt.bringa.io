import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isLocalDemoModeEnabled } from "../src/lib/local-demo-mode.ts";

const configWithDemoEnabled = {
  development: {
    localDemoMode: true,
  },
};

test("enables local demo mode only for development builds with the config flag", () => {
  assert.equal(isLocalDemoModeEnabled({ config: configWithDemoEnabled, nodeEnv: "development" }), true);
  assert.equal(isLocalDemoModeEnabled({ config: configWithDemoEnabled, nodeEnv: "production" }), false);
  assert.equal(isLocalDemoModeEnabled({ config: { development: { localDemoMode: false } }, nodeEnv: "development" }), false);
});

test("keeps the committed quick-start config useful without a backend", async () => {
  const generatedConfig = JSON.parse(
    await readFile(new URL("../src/config/bringa.config.generated.json", import.meta.url), "utf8"),
  );

  assert.equal(generatedConfig.development.localDemoMode, true);
  assert.equal(isLocalDemoModeEnabled({ config: generatedConfig, nodeEnv: "development" }), true);
  assert.equal(isLocalDemoModeEnabled({ config: generatedConfig, nodeEnv: "production" }), false);
});
