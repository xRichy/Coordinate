import { NextRequest, NextResponse } from "next/server";

// Paths that bypass tenant resolution on the root domain.
const PUBLIC_PATH_PATTERNS = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/api\/auth\//,
  /^\/api\/trpc\//,
  /^\/api\/tenant-check/,
  /^\/$/,
  /^\/login(\/.*)?$/,
  /^\/signup(\/.*)?$/,
  /^\/pricing(\/.*)?$/,
  /^\/privacy(\/.*)?$/,
  /^\/terms(\/.*)?$/,
];

// Paths that always pass through without modification (on any domain).
const ALWAYS_BYPASS = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/api\/auth\//,
];

/**
 * Extract the tenant slug from the hostname.
 *
 * Dev:        *.lvh.me:3000   → subdomain before .lvh.me
 * Production: *.coordinate.app → subdomain before .coordinate.app
 * localhost / 127.0.0.1       → null (no subdomain, dev bypass)
 */
function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0]; // strip port

  if (host.endsWith(".lvh.me")) {
    const sub = host.slice(0, -".lvh.me".length);
    return sub || null;
  }

  const PROD = "coordinate.app";
  if (host === PROD || host === `www.${PROD}`) return null;
  if (host.endsWith(`.${PROD}`)) {
    const sub = host.slice(0, -(`.${PROD}`.length));
    return sub || null;
  }

  // localhost / 127.0.0.1 → no tenant (local dev without subdomain)
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  const slug = extractSubdomain(hostname);

  if (!slug) {
    // Root domain or localhost: allow public paths, redirect everything else
    if (PUBLIC_PATH_PATTERNS.some((r) => r.test(pathname))) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Tenant subdomain — always pass through Next.js internals
  if (ALWAYS_BYPASS.some((r) => r.test(pathname))) {
    return NextResponse.next();
  }

  // Forward the tenant slug to server components via request header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", slug);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
