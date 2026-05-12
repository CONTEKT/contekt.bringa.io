import assert from "node:assert/strict";
import test from "node:test";

import { createLocalDemoSupabaseClient, localDemoUser } from "../src/lib/local-demo-supabase.ts";

test("returns a validated local demo session and profile without a backend", async () => {
  const supabase = createLocalDemoSupabaseClient();

  const sessionResult = await supabase.auth.getSession();
  assert.equal(sessionResult.error, null);
  assert.equal(sessionResult.data.session.user.id, localDemoUser.id);

  const profileResult = await supabase
    .from("profiles")
    .select("profile_valid, display_name, display_surname")
    .eq("id", localDemoUser.id)
    .single();

  assert.equal(profileResult.error, null);
  assert.deepEqual(profileResult.data, {
    profile_valid: true,
    display_name: "Local",
    display_surname: "Demo",
  });
});

test("supports dashboard item filters, counts, and ordering in memory", async () => {
  const supabase = createLocalDemoSupabaseClient();

  const availableResult = await supabase
    .from("items")
    .select("*")
    .eq("status", "inStock")
    .ilike("name", "%lamp%")
    .order("name", { ascending: true });

  assert.equal(availableResult.error, null);
  assert.deepEqual(
    availableResult.data.map((item) => item.name),
    ["Desk Lamp"],
  );

  const borrowedCount = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("borrowed_by", localDemoUser.id);

  assert.equal(borrowedCount.error, null);
  assert.equal(borrowedCount.data, null);
  assert.equal(borrowedCount.count, 1);
});

test("supports core item RPCs against the local demo data set", async () => {
  const supabase = createLocalDemoSupabaseClient();

  const createResult = await supabase.rpc("create_item", {
    name_input: "Demo Drill",
    description_input: "Cordless drill for trying the create flow.",
    image_url_input: "https://storage.example.test/items/user/image/detail.webp",
    thumbnail_url_input: "https://storage.example.test/items/user/image/thumb.webp",
    image_storage_bucket_input: "items",
    image_storage_path_input: "user/image/detail.webp",
    thumbnail_storage_path_input: "user/image/thumb.webp",
  });
  assert.equal(createResult.error, null);
  assert.match(createResult.data, /^demo-item-/);

  const createdItem = await supabase.from("items").select("*").eq("id", createResult.data).single();
  assert.equal(createdItem.data.name, "Demo Drill");
  assert.equal(createdItem.data.created_by, localDemoUser.id);
  assert.equal(createdItem.data.image_url, "https://storage.example.test/items/user/image/detail.webp");
  assert.equal(createdItem.data.thumbnail_url, "https://storage.example.test/items/user/image/thumb.webp");

  const borrowResult = await supabase.rpc("borrow_item", { item_id_input: "demo-desk-lamp" });
  assert.equal(borrowResult.error, null);
  assert.equal(borrowResult.data, true);

  const borrowedItem = await supabase.from("items").select("status, borrowed_by").eq("id", "demo-desk-lamp").single();
  assert.deepEqual(borrowedItem.data, { status: "borrowed", borrowed_by: localDemoUser.id });

  const returnResult = await supabase.rpc("return_item", { item_id_input: "demo-desk-lamp" });
  assert.equal(returnResult.error, null);
  assert.equal(returnResult.data, true);
});

test("returns displayable public URLs for local demo storage uploads", async () => {
  const supabase = createLocalDemoSupabaseClient();
  const storage = supabase.storage.from("items");
  const uploadResult = await storage.upload("demo.webp", new Blob(["demo"], { type: "image/webp" }));

  assert.equal(uploadResult.error, null);

  const { data } = storage.getPublicUrl("demo.webp");
  assert.match(data.publicUrl, /^(blob:|data:image\/)/);
});
