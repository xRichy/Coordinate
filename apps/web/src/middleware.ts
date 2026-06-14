import { NextRequest, NextResponse } from "next/server";

// Paths that are always passed through without injecting x-tenant-slug.
const BYPASS_PATTERNS = [
  /^\/_next\//,
  /^\/favicon\.ico$/,
  /^\/api\/auth\//,
  /^\/api\/trpc\//,
  /^\/api\/inngest\//,
  /^\/$/,
  /^\/login(\/.*)?$/,
  /^\/signup(\/.*)?$/,
  /^\/pricing(\/.*)?$/,
  /^\/privacy(\/.*)?$/,
  /^\/terms(\/.*)?$/,
  /^\/dpa(\/.*)?$/,
];

// Match /t/<slug> or /t/<slug>/...
const TENANT_PATH_RE = /^\/t\/([^/]+)(\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always bypass Next.js internals and public routes.
  if (BYPASS_PATTERNS.some((r) => r.test(pathname))) {
    return NextResponse.next();
  }

  const match = TENANT_PATH_RE.exec(pathname);
  if (!match) {
    // Not a tenant path and not a bypass path — pass through.
    return NextResponse.next();
  }

  const slug = match[1];

  // Inject the tenant slug header so server components can resolve the tenant.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", slug);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
