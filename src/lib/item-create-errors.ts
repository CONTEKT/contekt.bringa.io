export const createItemRejectedMessage =
  "The item was not created because Supabase rejected the request. Refresh your session, confirm your profile is validated, and check that the Supabase item migrations are applied.";

const fallbackCreateItemError =
  "Item creation failed. Please try again. If it fails again, ask an operator to check the Supabase item setup.";

function asErrorRecord(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") return null;
  return error as Record<string, unknown>;
}

function stringProp(error: unknown, key: string) {
  const record = asErrorRecord(error);
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectErrorText(error: unknown) {
  if (error instanceof Error) {
    return [error.name, error.message, stringProp(error, "code")].filter(Boolean).join(" ");
  }

  if (typeof error === "string") return error;

  return ["code", "status", "statusCode", "error", "message", "details", "hint"]
    .map((key) => stringProp(error, key))
    .filter(Boolean)
    .join(" ");
}

function rawErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  return stringProp(error, "message") || stringProp(error, "error");
}

export function buildCreateItemErrorMessage(error: unknown) {
  const errorText = collectErrorText(error);
  const normalized = errorText.toLowerCase();
  const code = stringProp(error, "code");

  if (
    code === "PGRST202" ||
    (normalized.includes("could not find the function") && normalized.includes("public.create_item"))
  ) {
    return "Supabase database setup is incomplete: the create_item RPC is missing. Apply the Supabase migrations for this project, then reload the app. (PGRST202)";
  }

  if (normalized.includes("bucket not found") || (normalized.includes("storage bucket") && normalized.includes("not found"))) {
    return "Supabase Storage setup is incomplete: the items bucket is missing. Apply the Supabase migrations for this project, then reload the app.";
  }

  if (
    normalized.includes("row-level security") ||
    normalized.includes("violates security policy") ||
    code === "42501"
  ) {
    return "Supabase rejected the request because its security policy did not allow it. Check that your profile is validated and the item Storage policies are applied.";
  }

  return rawErrorMessage(error) || fallbackCreateItemError;
}
