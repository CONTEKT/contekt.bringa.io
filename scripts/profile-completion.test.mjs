import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProfileCompletionCopy,
  buildProfileCompletionSubmitState,
  validateProfileCompletionInput,
} from "../src/lib/profile-completion.ts";

test("validates and normalizes profile completion names", () => {
  assert.deepEqual(validateProfileCompletionInput({ name: " Ada ", surname: " Lovelace " }), {
    ok: true,
    values: {
      displayName: "Ada",
      displaySurname: "Lovelace",
    },
  });

  assert.deepEqual(validateProfileCompletionInput({ name: "Ada", surname: " " }), {
    ok: false,
    error: "Please enter both first and last name.",
  });
});

test("builds profile completion submit state", () => {
  assert.deepEqual(buildProfileCompletionSubmitState({ saving: false }), {
    disabled: false,
    busy: false,
    label: "Save and continue",
  });

  assert.deepEqual(buildProfileCompletionSubmitState({ saving: true }), {
    disabled: true,
    busy: true,
    label: "Saving...",
  });
});

test("builds English profile completion copy", () => {
  assert.deepEqual(buildProfileCompletionCopy(), {
    title: "Complete profile",
    description: "Enter your first and last name to continue.",
    firstNameLabel: "First name",
    firstNamePlaceholder: "Ada",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Lovelace",
  });
});
