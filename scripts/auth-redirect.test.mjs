import assert from "node:assert/strict";
import test from "node:test";

import { buildOAuthRedirectTo } from "../src/lib/auth-redirect.ts";

test("expands app-relative OAuth redirects with the browser origin", () => {
  assert.equal(buildOAuthRedirectTo("/dashboard", "https://app.example"), "https://app.example/dashboard");
});

test("keeps absolute OAuth redirects unchanged", () => {
  assert.equal(
    buildOAuthRedirectTo("https://app.example/dashboard", "https://other.example"),
    "https://app.example/dashboard",
  );
});

test("keeps relative OAuth redirects unchanged when no origin is available", () => {
  assert.equal(buildOAuthRedirectTo("/dashboard", null), "/dashboard");
});
