/**
 * Determines whether we're running in a local dev environment based on the
 * current browser hostname. Covers: localhost, 127.0.0.1, lvh.me (root),
 * and any *.lvh.me subdomain.
 */
function isLocalDev(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "lvh.me" ||
    hostname.endsWith(".lvh.me")
  );
}

/**
 * Returns the full URL for a tenant's dashboard.
 *   Dev:  http://<slug>.lvh.me:<port>/dashboard
 *   Prod: https://<slug>.coordinate.app/dashboard
 */
export function getTenantDashboardUrl(slug: string): string {
  const { hostname, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  if (isLocalDev(hostname)) return `http://${slug}.lvh.me${portSuffix}/dashboard`;
  return `https://${slug}.coordinate.app/dashboard`;
}

/**
 * Returns the full URL for the root-domain login page.
 * Used after logout to redirect away from any tenant subdomain.
 *   Dev:  http://lvh.me:<port>/login
 *   Prod: https://coordinate.app/login
 */
export function getLoginUrl(): string {
  const { hostname, port } = window.location;
  const portSuffix = port ? `:${port}` : "";
  if (isLocalDev(hostname)) return `http://lvh.me${portSuffix}/login`;
  return "https://coordinate.app/login";
}
