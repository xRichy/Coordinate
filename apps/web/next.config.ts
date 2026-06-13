import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@coordinate/database"],
  turbopack: {
    root: "../..",
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
