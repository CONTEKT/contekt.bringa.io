import type { ItemVisibilityState } from "@/app/model/model";

export type ItemVisibilityAction = "hide" | "request_visible";

export type ItemVisibilityRequestResult = {
  ok: boolean;
  visibilityState: "user_hidden" | "pending_visible" | null;
  reason: string | null;
};

const inactiveStates = new Set<ItemVisibilityState>(["deleted_user_hidden", "archived"]);

export function itemVisibilityActionForState(
  visibilityState: ItemVisibilityState | null | undefined,
): ItemVisibilityAction | null {
  const state = visibilityState || "visible";
  if (state === "visible") return "hide";
  if (state === "user_hidden" || state === "admin_hidden") return "request_visible";
  return null;
}

export function buildItemVisibilityRequest({
  action,
  currentVisibility,
  reason,
}: {
  action: ItemVisibilityAction;
  currentVisibility: ItemVisibilityState | null | undefined;
  reason: string;
}): ItemVisibilityRequestResult {
  const state = currentVisibility || "visible";
  const normalizedReason = reason.trim() || null;

  if (!normalizedReason || normalizedReason.length < 3 || inactiveStates.has(state)) {
    return { ok: false, visibilityState: null, reason: null };
  }

  if (action === "hide" && (state === "visible" || state === "pending_visible" || state === "user_hidden")) {
    return { ok: true, visibilityState: "user_hidden", reason: normalizedReason };
  }

  if (action === "request_visible" && (state === "user_hidden" || state === "admin_hidden")) {
    return { ok: true, visibilityState: "pending_visible", reason: normalizedReason };
  }

  return { ok: false, visibilityState: null, reason: null };
}
