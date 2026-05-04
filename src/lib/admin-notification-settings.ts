export type AdminNotificationSettingsInput = {
  telegramAdminNotifications: boolean;
};

export type AdminNotificationSectionKey = "telegram" | "mute" | "dedupe" | "seen";

export type AdminNotificationSection = {
  key: AdminNotificationSectionKey;
  label: string;
  status: "Configured" | "Disabled" | "Prepared";
  detail: string;
};

export type AdminNotificationSettings = {
  sections: AdminNotificationSection[];
  muteWindows: string[];
};

export function buildAdminNotificationSettings(
  input: AdminNotificationSettingsInput,
): AdminNotificationSettings {
  return {
    sections: [
      {
        key: "telegram",
        label: "Telegram",
        status: input.telegramAdminNotifications ? "Configured" : "Disabled",
        detail: "Deployment-level notification switch.",
      },
      {
        key: "mute",
        label: "Mute windows",
        status: "Prepared",
        detail: "Operator choices for user-level notification muting.",
      },
      {
        key: "dedupe",
        label: "Dedupe",
        status: "Prepared",
        detail: "One notification per unseen user queue until admin review.",
      },
      {
        key: "seen",
        label: "Admin seen-state",
        status: "Prepared",
        detail: "Review state for future queue notification throttling.",
      },
    ],
    muteWindows: ["1 day", "1 week", "Forever"],
  };
}
