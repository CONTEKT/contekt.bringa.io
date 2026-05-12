import assert from "node:assert/strict";
import test from "node:test";

import {
  buildItemImageRpcFields,
  buildItemImageStoragePaths,
  cleanupUploadedItemImage,
  uploadItemImageRenditions,
} from "../src/lib/item-image-upload.ts";

const mediaConfig = {
  acceptedImageMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maxUploadBytes: 10_485_760,
  compressionMaxSizeMb: 1,
  compressionMaxWidthOrHeight: 1920,
  thumbnailCompressionMaxSizeMb: 0.25,
  thumbnailCompressionMaxWidthOrHeight: 333,
};

function createStorageStub({ failPath } = {}) {
  const uploaded = [];
  const removed = [];

  const supabase = {
    storage: {
      from(bucket) {
        return {
          async upload(path, body, options) {
            if (path === failPath) {
              return { data: null, error: new Error(`Failed ${path}`) };
            }
            uploaded.push({ bucket, path, body, options });
            return { data: { path }, error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://storage.example.test/${bucket}/${path}` } };
          },
          async remove(paths) {
            removed.push(...paths);
            return { data: paths, error: null };
          },
        };
      },
    },
  };

  return { supabase, uploaded, removed };
}

test("builds stable detail and thumbnail paths under the user and image id", () => {
  assert.deepEqual(
    buildItemImageStoragePaths({
      userId: "00000000-0000-4000-8000-000000000001",
      imageId: "11111111-1111-4111-8111-111111111111",
    }),
    {
      bucket: "items",
      imageId: "11111111-1111-4111-8111-111111111111",
      detailPath: "00000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/detail.webp",
      thumbnailPath: "00000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111/thumb.webp",
    },
  );
});

test("uploads detail and thumbnail renditions from one selected image", async () => {
  const { supabase, uploaded, removed } = createStorageStub();
  const compressionOptions = [];
  const sourceFile = new File(["source"], "camera.jpg", { type: "image/jpeg" });

  const result = await uploadItemImageRenditions({
    file: sourceFile,
    userId: "00000000-0000-4000-8000-000000000001",
    imageId: "22222222-2222-4222-8222-222222222222",
    mediaConfig,
    supabase,
    compressImage: async (_file, options) => {
      compressionOptions.push(options);
      return new Blob([String(options.maxWidthOrHeight)], { type: "image/webp" });
    },
  });

  assert.deepEqual(
    compressionOptions.map((options) => options.maxWidthOrHeight),
    [1920, 333],
  );
  assert.deepEqual(
    uploaded.map((entry) => entry.path),
    [
      "00000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222/detail.webp",
      "00000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222/thumb.webp",
    ],
  );
  assert.deepEqual(
    uploaded.map((entry) => entry.options),
    [
      { contentType: "image/webp", upsert: false },
      { contentType: "image/webp", upsert: false },
    ],
  );
  assert.deepEqual(removed, []);
  assert.equal(result.imageId, "22222222-2222-4222-8222-222222222222");
  assert.equal(result.detailUrl, "https://storage.example.test/items/00000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222/detail.webp");
  assert.equal(result.thumbnailUrl, "https://storage.example.test/items/00000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222/thumb.webp");
});

test("cleans up already uploaded detail rendition when thumbnail upload fails", async () => {
  const { supabase, removed } = createStorageStub({
    failPath: "00000000-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333/thumb.webp",
  });

  await assert.rejects(
    uploadItemImageRenditions({
      file: new File(["source"], "camera.jpg", { type: "image/jpeg" }),
      userId: "00000000-0000-4000-8000-000000000001",
      imageId: "33333333-3333-4333-8333-333333333333",
      mediaConfig,
      supabase,
      compressImage: async (_file, options) => new Blob([String(options.maxWidthOrHeight)], { type: "image/webp" }),
    }),
    /Failed/,
  );

  assert.deepEqual(removed, [
    "00000000-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333/detail.webp",
  ]);
});

test("builds RPC fields and cleanup paths for a completed upload", async () => {
  const upload = {
    bucket: "items",
    imageId: "44444444-4444-4444-8444-444444444444",
    detailPath: "user/image/detail.webp",
    thumbnailPath: "user/image/thumb.webp",
    detailUrl: "https://storage.example.test/items/user/image/detail.webp",
    thumbnailUrl: "https://storage.example.test/items/user/image/thumb.webp",
  };
  const { supabase, removed } = createStorageStub();

  assert.deepEqual(buildItemImageRpcFields(upload), {
    image_url_input: "https://storage.example.test/items/user/image/detail.webp",
    thumbnail_url_input: "https://storage.example.test/items/user/image/thumb.webp",
    image_storage_bucket_input: "items",
    image_storage_path_input: "user/image/detail.webp",
    thumbnail_storage_path_input: "user/image/thumb.webp",
  });

  await cleanupUploadedItemImage(supabase, upload);
  assert.deepEqual(removed, ["user/image/detail.webp", "user/image/thumb.webp"]);
});
