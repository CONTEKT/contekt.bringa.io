export type AdminRouteGate = {
  redirectTo: "/dashboard" | null;
  showLoading: boolean;
  render: boolean;
};

export function buildAdminRouteGate({
  adminLoading,
  isAdmin,
  contentLoading = false,
}: {
  adminLoading: boolean;
  isAdmin: boolean;
  contentLoading?: boolean;
}): AdminRouteGate {
  if (adminLoading) {
    return { redirectTo: null, showLoading: true, render: false };
  }

  if (!isAdmin) {
    return { redirectTo: "/dashboard", showLoading: false, render: false };
  }

  if (contentLoading) {
    return { redirectTo: null, showLoading: true, render: false };
  }

  return { redirectTo: null, showLoading: false, render: true };
}
