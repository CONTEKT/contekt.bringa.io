import type { ItemDb } from "@/app/model/model";

export type AdminVisibilityQueueItem = Pick<ItemDb, "id" | "name" | "status" | "visibility_state" | "visibility_reason" | "image_url"> & {
  created_at?: string | null;
};

export type AdminVisibilityQueueEntry = AdminVisibilityQueueItem & {
  nameLabel: string;
  reasonLabel: string;
};

function dateTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function pendingVisibleNewestFirst(left: AdminVisibilityQueueItem, right: AdminVisibilityQueueItem): number {
  const rightTime = dateTime(right.created_at);
  const leftTime = dateTime(left.created_at);

  if (Number.isFinite(rightTime) && Number.isFinite(leftTime)) {
    return rightTime - leftTime;
  }

  if (Number.isFinite(rightTime)) return 1;
  if (Number.isFinite(leftTime)) return -1;
  return 0;
}

export function buildAdminVisibilityQueue(items: AdminVisibilityQueueItem[]): AdminVisibilityQueueEntry[] {
  return items
    .filter((item) => item.visibility_state === "pending_visible")
    .sort(pendingVisibleNewestFirst)
    .map((item) => ({
      ...item,
      nameLabel: item.name?.trim() || "Unnamed item",
      reasonLabel: item.visibility_reason?.trim() || "No reason recorded",
    }));
}
