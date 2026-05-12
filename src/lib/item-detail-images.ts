export type ItemDetailImageItem = {
  id: string;
  name: string;
  image_url: string | null;
  thumbnail_url?: string | null;
};

export type ItemDetailImageRow = {
  id: string;
  public_url: string | null;
  thumbnail_public_url?: string | null;
  storage_path?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  is_cover?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
};

export type ItemDetailImage = {
  id: string;
  src: string;
  thumbnailSrc: string;
  alt: string;
  caption: string | null;
  isCover: boolean;
  sortOrder: number;
};

function cleanString(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function createdAtValue(value: string | null | undefined) {
  if (!value) return 0;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function appendIfUnique({
  image,
  seenDetailKeys,
  seenStoragePaths,
  gallery,
  storagePath,
}: {
  image: ItemDetailImage;
  seenDetailKeys: Set<string>;
  seenStoragePaths: Set<string>;
  gallery: Array<ItemDetailImage & { createdAt: number; storagePath: string | null }>;
  storagePath: string | null;
}) {
  if (seenDetailKeys.has(image.src) || (storagePath && seenStoragePaths.has(storagePath))) {
    return;
  }

  seenDetailKeys.add(image.src);
  if (storagePath) seenStoragePaths.add(storagePath);
  gallery.push({ ...image, createdAt: 0, storagePath });
}

export function buildItemDetailImages({
  item,
  itemImages,
}: {
  item: ItemDetailImageItem;
  itemImages: ItemDetailImageRow[];
}): ItemDetailImage[] {
  const gallery: Array<ItemDetailImage & { createdAt: number; storagePath: string | null }> = [];
  const seenDetailKeys = new Set<string>();
  const seenStoragePaths = new Set<string>();

  for (const row of itemImages) {
    const src = cleanString(row.public_url);
    if (!src) continue;

    const storagePath = cleanString(row.storage_path);
    if (seenDetailKeys.has(src) || (storagePath && seenStoragePaths.has(storagePath))) {
      continue;
    }

    seenDetailKeys.add(src);
    if (storagePath) seenStoragePaths.add(storagePath);

    gallery.push({
      id: row.id,
      src,
      thumbnailSrc: cleanString(row.thumbnail_public_url) ?? src,
      alt: cleanString(row.alt_text) ?? item.name,
      caption: cleanString(row.caption),
      isCover: Boolean(row.is_cover),
      sortOrder: row.sort_order ?? 0,
      createdAt: createdAtValue(row.created_at),
      storagePath,
    });
  }

  const legacySrc = cleanString(item.image_url);
  if (legacySrc) {
    appendIfUnique({
      image: {
        id: `${item.id}-legacy-image`,
        src: legacySrc,
        thumbnailSrc: cleanString(item.thumbnail_url) ?? legacySrc,
        alt: item.name,
        caption: null,
        isCover: true,
        sortOrder: 0,
      },
      seenDetailKeys,
      seenStoragePaths,
      gallery,
      storagePath: null,
    });
  }

  return gallery
    .sort((left, right) => {
      if (left.isCover !== right.isCover) return left.isCover ? -1 : 1;
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      return left.createdAt - right.createdAt;
    })
    .map((image) => ({
      id: image.id,
      src: image.src,
      thumbnailSrc: image.thumbnailSrc,
      alt: image.alt,
      caption: image.caption,
      isCover: image.isCover,
      sortOrder: image.sortOrder,
    }));
}
