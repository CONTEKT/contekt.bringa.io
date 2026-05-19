import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreateItemErrorMessage,
  createItemRejectedMessage,
} from "../src/lib/item-create-errors.ts";

test("explains when the create_item RPC is missing from Supabase", () => {
  const message = buildCreateItemErrorMessage({
    code: "PGRST202",
    message:
      "Could not find the function public.create_item(description_input, image_storage_bucket_input, image_storage_path_input, image_url_input, name_input, thumbnail_storage_path_input, thumbnail_url_input) in the schema cache",
  });

  assert.equal(
    message,
    "Supabase database setup is incomplete: the create_item RPC is missing. Apply the Supabase migrations for this project, then reload the app. (PGRST202)",
  );
});

test("explains when the item image bucket is missing", () => {
  const message = buildCreateItemErrorMessage({
    statusCode: "404",
    error: "Bucket not found",
    message: "Bucket not found",
  });

  assert.equal(
    message,
    "Supabase Storage setup is incomplete: the items bucket is missing. Apply the Supabase migrations for this project, then reload the app.",
  );
});

test("keeps useful Supabase messages from plain error objects", () => {
  assert.equal(
    buildCreateItemErrorMessage({ message: "new row violates row-level security policy" }),
    "Supabase rejected the request because its security policy did not allow it. Check that your profile is validated and the item Storage policies are applied.",
  );
});

test("uses a clear fallback for null RPC results", () => {
  assert.equal(
    createItemRejectedMessage,
    "The item was not created because Supabase rejected the request. Refresh your session, confirm your profile is validated, and check that the Supabase item migrations are applied.",
  );
});
