import type { ItemDb, ItemVisibilityState } from "@/app/model/model";

/** Columns needed to render the admin hidden-items list. */
export const ADMIN_HIDDEN_ITEM_SELECT =
  "id,name,status,visibility_state,visibility_reason,image_url,owner_kind,owner_label,owner_profile_id,created_by,created_at";

export type AdminHiddenItem = Pick<
  ItemDb,
  | "id"
  | "name"
  | "status"
  | "visibility_state"
  | "visibility_reason"
  | "image_url"
  | "owner_kind"
  | "owner_label"
  | "owner_profile_id"
  | "created_by"
> & {
  created_at?: string | null;
};

export type AdminHiddenItemEntry = AdminHiddenItem & {
  nameLabel: string;
  reasonLabel: string;
};

/** Every visibility state that keeps an item out of the normal browsing lists. */
const hiddenStates = new Set<ItemVisibilityState>([
  "user_hidden",
  "admin_hidden",
  "pending_visible",
  "deleted_user_hidden",
  "archived",
]);

/** Ordering used so the states that most need admin attention sort first. */
const stateRank: Record<string, number> = {
  pending_visible: 0,
  admin_hidden: 1,
  user_hidden: 2,
  deleted_user_hidden: 3,
  archived: 4,
};

export function isHiddenVisibilityState(state: string | null | undefined): boolean {
  return state != null && hiddenStates.has(state as ItemVisibilityState);
}

function dateTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function hiddenItemsOrder(left: AdminHiddenItem, right: AdminHiddenItem): number {
  const leftRank = stateRank[left.visibility_state || ""] ?? 99;
  const rightRank = stateRank[right.visibility_state || ""] ?? 99;
  if (leftRank !== rightRank) return leftRank - rightRank;

  const rightTime = dateTime(right.created_at);
  const leftTime = dateTime(left.created_at);
  if (Number.isFinite(rightTime) && Number.isFinite(leftTime)) return rightTime - leftTime;
  if (Number.isFinite(rightTime)) return 1;
  if (Number.isFinite(leftTime)) return -1;
  return 0;
}

export function buildAdminHiddenItems(items: AdminHiddenItem[]): AdminHiddenItemEntry[] {
  return items
    .filter((item) => isHiddenVisibilityState(item.visibility_state))
    .sort(hiddenItemsOrder)
    .map((item) => ({
      ...item,
      nameLabel: item.name?.trim() || "Unnamed item",
      reasonLabel: item.visibility_reason?.trim() || "No reason recorded",
    }));
}
