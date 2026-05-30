/**
 * Returns the relative path for a tenant's dashboard.
 * e.g. getTenantDashboardUrl("acme") → "/t/acme/dashboard"
 */
export function getTenantDashboardUrl(slug: string): string {
  return `/t/${slug}/dashboard`;
}

/**
 * Returns the relative path for the login page.
 * Used after logout to redirect back to the auth area.
 */
export function getLoginUrl(): string {
  return "/login";
}
