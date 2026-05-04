type UserItemRelationKey = "borrowed" | "owned" | "created";
type UserItemRelationLabel = "Current borrower" | "Owner" | "Creator";
export type AdminUserItemVisibilityState = "visible" | "admin_hidden";

export type AdminUserItem = {
  id: string;
  created_at?: string | null;
  created_by?: string | null;
  borrowed_by?: string | null;
  owner_profile_id?: string | null;
};

export type AdminUserItemRow<TItem extends AdminUserItem> = {
  item: TItem;
  relationLabels: UserItemRelationLabel[];
};

export type AdminUserItemGroup<TItem extends AdminUserItem> = {
  key: UserItemRelationKey;
  label: string;
  items: AdminUserItemRow<TItem>[];
};

export type AdminUserItemVisibilityReview = {
  ok: boolean;
  visibilityState: AdminUserItemVisibilityState | null;
  reason: string | null;
};

const groupLabels: Record<UserItemRelationKey, string> = {
  borrowed: "Currently borrowed",
  owned: "Owned items",
  created: "Created items",
};

function relationLabelsFor(item: AdminUserItem, userId: string): UserItemRelationLabel[] {
  const labels: UserItemRelationLabel[] = [];

  if (item.borrowed_by === userId) labels.push("Current borrower");
  if (item.owner_profile_id === userId) labels.push("Owner");
  if (item.created_by === userId) labels.push("Creator");

  return labels;
}

function primaryGroupFor(labels: UserItemRelationLabel[]): UserItemRelationKey | null {
  if (labels.includes("Current borrower")) return "borrowed";
  if (labels.includes("Owner")) return "owned";
  if (labels.includes("Creator")) return "created";
  return null;
}

function createdTime(item: AdminUserItem): number {
  return item.created_at ? new Date(item.created_at).getTime() : 0;
}

export function buildAdminUserItemGroups<TItem extends AdminUserItem>(
  items: TItem[],
  userId: string,
): AdminUserItemGroup<TItem>[] {
  const grouped = new Map<UserItemRelationKey, AdminUserItemRow<TItem>[]>();

  for (const item of items) {
    const relationLabels = relationLabelsFor(item, userId);
    const groupKey = primaryGroupFor(relationLabels);
    if (!groupKey) continue;

    const rows = grouped.get(groupKey) || [];
    rows.push({ item, relationLabels });
    grouped.set(groupKey, rows);
  }

  return (["borrowed", "owned", "created"] as const)
    .map((key) => ({
      key,
      label: groupLabels[key],
      items: (grouped.get(key) || []).sort((left, right) => createdTime(right.item) - createdTime(left.item)),
    }))
    .filter((group) => group.items.length > 0);
}

export function buildAdminUserItemVisibilityReview({
  visibilityState,
  reason,
}: {
  visibilityState: AdminUserItemVisibilityState;
  reason: string;
}): AdminUserItemVisibilityReview {
  const normalizedReason = reason.trim() || null;

  if (!normalizedReason || normalizedReason.length < 3) {
    return { ok: false, visibilityState: null, reason: null };
  }

  return { ok: true, visibilityState, reason: normalizedReason };
}
