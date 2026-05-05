import assert from "node:assert/strict";
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

