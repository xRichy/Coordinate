import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, twoFactor } from "better-auth/plugins";
import { prisma } from "@coordinate/database";
import { captureEvent } from "../analytics";

// Parent domain (with leading dot) for cross-subdomain session cookies.
// Without this, the cookie is set host-only, so signOut on a tenant
// subdomain can't clear the session held on the root domain.
const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN;

// Comma-separated list of origins (wildcards allowed, e.g. http://*.lvh.me:3000)
// that may issue auth requests. Required when the same Better-Auth instance
// is reached from multiple subdomains.
const trustedOrigins =
  process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  trustedOrigins,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    },
  },

  ...(cookieDomain
    ? {
        advanced: {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
          defaultCookieAttributes: {
            sameSite: "lax" as const,
          },
        },
      }
    : {}),

  plugins: [
    organization(),
    twoFactor(),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          captureEvent(user.id, "signup_completed", { email: user.email });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          captureEvent(session.userId, "login");
        },
      },
    },
  },
});

export type Auth = typeof auth;
