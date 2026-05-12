import {
  buildImageCompressionOptions,
  buildImageThumbnailCompressionOptions,
  type MediaPolicyConfig,
} from "./media-policy.ts";

export const ITEM_IMAGE_STORAGE_BUCKET = "items";
export const ITEM_IMAGE_DETAIL_FILE_NAME = "detail.webp";
export const ITEM_IMAGE_THUMBNAIL_FILE_NAME = "thumb.webp";

type ImageCompressionOptions = ReturnType<typeof buildImageCompressionOptions>;

type StorageBucketClient = {
  upload(
    path: string,
    body: Blob,
    options: { contentType: "image/webp"; upsert: false },
  ): Promise<{ error: Error | null } | { error: unknown }>;
  getPublicUrl(path: string): { data: { publicUrl: string } };
  remove(paths: string[]): Promise<{ error?: Error | null } | { error?: unknown }>;
};

type StorageClient = {
  storage: {
    from(bucket: string): StorageBucketClient;
  };
};

export type UploadedItemImage = {
  bucket: typeof ITEM_IMAGE_STORAGE_BUCKET;
  imageId: string;
  detailPath: string;
  thumbnailPath: string;
  detailUrl: string;
  thumbnailUrl: string;
};

export type ItemImageRpcFields = {
  image_url_input: string | null;
  thumbnail_url_input: string | null;
  image_storage_bucket_input: string | null;
  image_storage_path_input: string | null;
  thumbnail_storage_path_input: string | null;
};

function ensureStorageSegment(value: string, label: string) {
  if (!value || value.includes("/") || value.includes("..")) {
    throw new Error(`Invalid ${label} for item image storage path.`);
  }

  return value;
}

function createImageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildItemImageStoragePaths({
  userId,
  imageId = createImageId(),
}: {
  userId: string;
  imageId?: string;
}) {
  const safeUserId = ensureStorageSegment(userId, "user id");
  const safeImageId = ensureStorageSegment(imageId, "image id");
  const basePath = `${safeUserId}/${safeImageId}`;

  return {
    bucket: ITEM_IMAGE_STORAGE_BUCKET as typeof ITEM_IMAGE_STORAGE_BUCKET,
    imageId: safeImageId,
    detailPath: `${basePath}/${ITEM_IMAGE_DETAIL_FILE_NAME}`,
    thumbnailPath: `${basePath}/${ITEM_IMAGE_THUMBNAIL_FILE_NAME}`,
  };
}

async function cleanupPaths(storage: StorageBucketClient, paths: string[]) {
  if (paths.length === 0) return;

  try {
    await storage.remove(paths);
  } catch {
    // Best-effort cleanup only. The original upload or RPC error is more useful to the caller.
  }
}

export async function uploadItemImageRenditions({
  file,
  userId,
  imageId,
  mediaConfig,
  supabase,
  compressImage,
}: {
  file: File;
  userId: string;
  imageId?: string;
  mediaConfig: MediaPolicyConfig;
  supabase: StorageClient;
  compressImage: (file: File, options: ImageCompressionOptions) => Promise<Blob>;
}): Promise<UploadedItemImage> {
  const paths = buildItemImageStoragePaths({ userId, imageId });
  const storage = supabase.storage.from(paths.bucket);
  const uploadedPaths: string[] = [];

  try {
    const detailImage = await compressImage(file, buildImageCompressionOptions(mediaConfig));
    const thumbnailImage = await compressImage(file, buildImageThumbnailCompressionOptions(mediaConfig));

    const detailUpload = await storage.upload(paths.detailPath, detailImage, {
      contentType: "image/webp",
      upsert: false,
    });
    if (detailUpload.error) throw detailUpload.error;
    uploadedPaths.push(paths.detailPath);

    const thumbnailUpload = await storage.upload(paths.thumbnailPath, thumbnailImage, {
      contentType: "image/webp",
      upsert: false,
    });
    if (thumbnailUpload.error) throw thumbnailUpload.error;
    uploadedPaths.push(paths.thumbnailPath);

    return {
      ...paths,
      detailUrl: storage.getPublicUrl(paths.detailPath).data.publicUrl,
      thumbnailUrl: storage.getPublicUrl(paths.thumbnailPath).data.publicUrl,
    };
  } catch (error) {
    await cleanupPaths(storage, uploadedPaths);
    throw error;
  }
}

export function buildItemImageRpcFields(upload: UploadedItemImage | null | undefined): ItemImageRpcFields {
  return {
    image_url_input: upload?.detailUrl ?? null,
    thumbnail_url_input: upload?.thumbnailUrl ?? null,
    image_storage_bucket_input: upload?.bucket ?? null,
    image_storage_path_input: upload?.detailPath ?? null,
    thumbnail_storage_path_input: upload?.thumbnailPath ?? null,
  };
}

export async function cleanupUploadedItemImage(supabase: StorageClient, upload: UploadedItemImage | null | undefined) {
  if (!upload) return;

  await cleanupPaths(supabase.storage.from(upload.bucket), [upload.detailPath, upload.thumbnailPath]);
}
