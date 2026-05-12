import assert from "node:assert/strict";
import test from "node:test";

import { buildItemDetailImages } from "../src/lib/item-detail-images.ts";

const item = {
  id: "item-1",
  name: "Camera",
  image_url: "https://storage.example.test/items/user/cover/detail.webp",
  thumbnail_url: "https://storage.example.test/items/user/cover/thumb.webp",
};

test("builds a single legacy detail image from item image_url", () => {
  assert.deepEqual(buildItemDetailImages({ item, itemImages: [] }), [
    {
      id: "item-1-legacy-image",
      src: "https://storage.example.test/items/user/cover/detail.webp",
      thumbnailSrc: "https://storage.example.test/items/user/cover/thumb.webp",
      alt: "Camera",
      caption: null,
      isCover: true,
      sortOrder: 0,
    },
  ]);
});

test("sorts accepted item images with the cover first, then sort order and creation date", () => {
  const images = buildItemDetailImages({
    item,
    itemImages: [
      {
        id: "late",
        public_url: "https://storage.example.test/items/user/late/detail.webp",
        thumbnail_public_url: "https://storage.example.test/items/user/late/thumb.webp",
        storage_path: "user/late/detail.webp",
        alt_text: "Late detail",
        caption: "Late caption",
        is_cover: false,
        sort_order: 10,
        created_at: "2026-05-07T12:00:00.000Z",
      },
      {
        id: "cover",
        public_url: "https://storage.example.test/items/user/cover/detail.webp",
        thumbnail_public_url: "https://storage.example.test/items/user/cover/thumb.webp",
        storage_path: "user/cover/detail.webp",
        alt_text: "",
        caption: "",
        is_cover: true,
        sort_order: 100,
        created_at: "2026-05-07T14:00:00.000Z",
      },
      {
        id: "early",
        public_url: "https://storage.example.test/items/user/early/detail.webp",
        thumbnail_public_url: null,
        storage_path: "user/early/detail.webp",
        alt_text: "Early detail",
        caption: null,
        is_cover: false,
        sort_order: 1,
        created_at: "2026-05-07T10:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(images.map((image) => image.id), ["cover", "early", "late"]);
  assert.equal(images[0].alt, "Camera");
  assert.equal(images[0].caption, null);
  assert.equal(images[1].thumbnailSrc, "https://storage.example.test/items/user/early/detail.webp");
});

test("deduplicates item fallback and ignores image rows without a detail URL", () => {
  const images = buildItemDetailImages({
    item,
    itemImages: [
      {
        id: "duplicate-cover",
        public_url: item.image_url,
        thumbnail_public_url: item.thumbnail_url,
        storage_path: "user/cover/detail.webp",
        alt_text: "Duplicate cover",
        caption: "Duplicate",
        is_cover: true,
        sort_order: 0,
        created_at: "2026-05-07T10:00:00.000Z",
      },
      {
        id: "missing-public-url",
        public_url: null,
        thumbnail_public_url: "https://storage.example.test/items/user/missing/thumb.webp",
        storage_path: "user/missing/detail.webp",
        alt_text: "Missing",
        caption: "Ignored",
        is_cover: false,
        sort_order: 1,
        created_at: "2026-05-07T11:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(images.map((image) => image.id), ["duplicate-cover"]);
  assert.equal(images[0].caption, "Duplicate");
});

test("returns an empty gallery when no detail image exists", () => {
  assert.deepEqual(
    buildItemDetailImages({
      item: { ...item, image_url: null, thumbnail_url: null },
      itemImages: [],
    }),
    [],
  );
});
