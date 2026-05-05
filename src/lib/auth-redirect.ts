export function buildOAuthRedirectTo(redirectTo: string, origin?: string | null) {
  if (redirectTo.startsWith("/") && origin) {
    return `${origin}${redirectTo}`;
  }

  return redirectTo;
}

export function buildBrowserOAuthRedirectTo(redirectTo: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : null;
  return buildOAuthRedirectTo(redirectTo, origin);
}
