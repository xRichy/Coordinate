import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy scoped to what the app actually loads:
// - scripts/styles: self + inline (Next.js App Router injects inline bootstrap
//   scripts; no external script CDNs are used — next/font self-hosts the fonts).
//   In dev we also allow 'unsafe-eval' + ws: for Turbopack/HMR.
// - connect-src: Sentry ingest, PostHog, and Vercel Blob (client-side uploads).
// - img-src: https/data/blob to allow product photos & attachments from Blob.
const csp = [
  "default-src 'self'",
  // 'wasm-unsafe-eval' is needed in prod for @react-pdf/renderer's yoga (WASM)
  // layout engine; dev adds 'unsafe-eval' for Turbopack/HMR.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://*.ingest.de.sentry.io",
    "https://*.posthog.com",
    "https://*.public.blob.vercel-storage.com",
    "https://blob.vercel-storage.com",
    isDev ? "ws: wss:" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // HSTS only in production (ignored over http, but avoids pinning localhost).
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@coordinate/database"],
  turbopack: {
    root: "../..",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps when Sentry is fully configured (CI/production).
  silent: !process.env.CI,
  disableLogger: true,

  // Automatically instrument Next.js API routes.
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,

  // Suppress build-time source map upload when DSN not set (local dev).
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Suppress "You have opted out of Sentry SDK default integrations" warning.
  telemetry: false,
});
