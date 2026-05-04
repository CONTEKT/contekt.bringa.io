type StatusRow = {
  status?: string | null;
};

type ProfileValidationRow = {
  profile_valid?: boolean | null;
};

export type AdminQueueCountsInput = {
  suggestions?: StatusRow[] | null;
  flags?: StatusRow[] | null;
  deletionRequests?: StatusRow[] | null;
  profiles?: ProfileValidationRow[] | null;
};

export type AdminQueueCounts = {
  pendingSuggestions: number;
  pendingFlags: number;
  openDeletionRequests: number;
  pendingUsers: number;
};

function countStatus(rows: StatusRow[] | null | undefined, statuses: Set<string>): number {
  return (rows || []).filter((row) => row.status && statuses.has(row.status)).length;
}

export function buildAdminQueueCounts(input: AdminQueueCountsInput): AdminQueueCounts {
  return {
    pendingSuggestions: countStatus(input.suggestions, new Set(["pending"])),
    pendingFlags: countStatus(input.flags, new Set(["pending"])),
    openDeletionRequests: countStatus(input.deletionRequests, new Set(["pending", "reviewing"])),
    pendingUsers: (input.profiles || []).filter((profile) => profile.profile_valid === false).length,
  };
}
