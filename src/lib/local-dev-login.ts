type LocalDevLoginConfig = {
  supabase?: {
    url?: string;
  };
  development?: {
    localDemoMode?: boolean;
  };
};

export const localDevEmailAccounts = [
  {
    label: "Admin",
    email: "admin@bringa.local",
    password: "bringa-local-admin-123",
  },
  {
    label: "Member",
    email: "member@bringa.local",
    password: "bringa-local-member-123",
  },
];

function isLocalSupabaseUrl(value: string | undefined) {
  try {
    const parsed = new URL(value || "");
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function isLocalSupabaseDevelopment({
  config,
  nodeEnv = process.env.NODE_ENV,
}: {
  config: LocalDevLoginConfig;
  nodeEnv?: string;
}) {
  return (
    nodeEnv === "development" &&
    config.development?.localDemoMode !== true &&
    isLocalSupabaseUrl(config.supabase?.url)
  );
}
