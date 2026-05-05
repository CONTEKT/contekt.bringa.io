import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInviteCodeInput,
  buildInviteErrorMessage,
  buildInviteIntroCopy,
  buildInviteSubmitState,
} from "../src/lib/invite-flow.ts";

test("normalizes invite code input before RPC submission", () => {
  assert.equal(buildInviteCodeInput("  Invite-123  "), "Invite-123");
});

test("builds invite submit state from loading and input state", () => {
  assert.deepEqual(buildInviteSubmitState({ code: "", loading: false }), {
    disabled: true,
    label: "Continue",
    busy: false,
  });
  assert.deepEqual(buildInviteSubmitState({ code: "  CODE  ", loading: false }), {
    disabled: false,
    label: "Continue",
    busy: false,
  });
  assert.deepEqual(buildInviteSubmitState({ code: "CODE", loading: true }), {
    disabled: true,
    label: "Verifying...",
    busy: true,
  });
});

test("keeps invite errors English and accessible", () => {
  assert.equal(buildInviteErrorMessage("invalidCode"), "Invalid invite code. Please try again.");
  assert.equal(buildInviteErrorMessage("unexpected"), "Something went wrong. Please try again later.");
});

test("builds invite intro copy for invite-only and admin-approval deployments", () => {
  assert.deepEqual(buildInviteIntroCopy({ appName: "bringa", allowSignupWithoutInvite: false }), {
    title: "Welcome to bringa",
    description: "Please enter your invite code to access the app.",
  });
  assert.deepEqual(buildInviteIntroCopy({ appName: "bringa", allowSignupWithoutInvite: true }), {
    title: "Welcome to bringa",
    description: "Enter an invite code if you have one, or wait for an admin to validate your profile.",
  });
});
