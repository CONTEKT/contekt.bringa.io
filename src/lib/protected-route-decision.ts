export type ProtectedProfile = {
  profile_valid?: boolean | null;
  display_name?: string | null;
  display_surname?: string | null;
};

export type ProtectedRouteDecision = {
  authenticated: boolean;
  profileValid: boolean;
  redirectTo: "/login" | "/invite" | "/complete-profile" | null;
};

export function decideProtectedRoute({
  hasSession,
  profile,
  profileError = false,
}: {
  hasSession: boolean;
  profile: ProtectedProfile | null;
  profileError?: boolean;
}): ProtectedRouteDecision {
  if (!hasSession || profileError || !profile) {
    return { authenticated: false, profileValid: false, redirectTo: "/login" };
  }

  if (!profile.profile_valid) {
    return { authenticated: false, profileValid: false, redirectTo: "/invite" };
  }

  if (!profile.display_name?.trim() || !profile.display_surname?.trim()) {
    return { authenticated: false, profileValid: true, redirectTo: "/complete-profile" };
  }

  return { authenticated: true, profileValid: true, redirectTo: null };
}
