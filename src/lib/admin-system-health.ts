export type AdminSystemHealthInput = {
  repositoryUrl: string;
  telegramAdminNotifications: boolean;
  maxUploadBytes: number;
  acceptedImageMimeTypes: string[];
};

export type AdminSystemHealthItemKey =
  | "config"
  | "supabase"
  | "storage"
  | "backups"
  | "docs"
  | "telegram";

export type AdminSystemHealthItem = {
  key: AdminSystemHealthItemKey;
  label: string;
  value: string;
  detail: string;
  href?: string;
};

function docHref(repositoryUrl: string, path: string): string | undefined {
  const cleanUrl = repositoryUrl.replace(/\/$/, "");
  return cleanUrl ? `${cleanUrl}/blob/main/${path}` : undefined;
}

function formatMegabytes(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}

function pluralizeType(count: number): string {
  return count === 1 ? "type" : "types";
}

export function buildAdminSystemHealthItems(input: AdminSystemHealthInput): AdminSystemHealthItem[] {
  const acceptedTypes = input.acceptedImageMimeTypes.length;

  return [
    {
      key: "config",
      label: "Config",
      value: "Manual CI",
      detail: "Run pnpm check:config before releases or deployment profile changes.",
      href: docHref(input.repositoryUrl, "docs/configuration.md"),
    },
    {
      key: "supabase",
      label: "Supabase contract",
      value: "Local checker",
      detail: "Run pnpm check:supabase-contract after schema, RPC, policy, or Storage changes.",
      href: docHref(input.repositoryUrl, "docs/supabase.md"),
    },
    {
      key: "storage",
      label: "Storage contract",
      value: `${formatMegabytes(input.maxUploadBytes)} MB, ${acceptedTypes} ${pluralizeType(acceptedTypes)}`,
      detail: "Frontend media limits and the committed Storage contract should stay aligned.",
      href: docHref(input.repositoryUrl, "docs/supabase.md"),
    },
    {
      key: "backups",
      label: "Backup freshness",
      value: "Manual backup",
      detail: "Run pnpm backup:supabase before production database work when a service role key is available.",
      href: docHref(input.repositoryUrl, "docs/maintenance.md"),
    },
    {
      key: "docs",
      label: "Docs",
      value: "Manual workflow",
      detail: "Run the Docs workflow manually when branch or release docs need remote verification.",
      href: docHref(input.repositoryUrl, "docs/index.md"),
    },
    {
      key: "telegram",
      label: "Telegram",
      value: input.telegramAdminNotifications ? "Configured" : "Disabled",
      detail: "Mute, dedupe, and seen-state are prepared roadmap items.",
      href: docHref(input.repositoryUrl, "docs/telegramBot.md"),
    },
  ];
}
