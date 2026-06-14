import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, twoFactor } from "better-auth/plugins";
import { prisma } from "@coordinate/database";
import { captureEvent } from "../analytics";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

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

/**
 * Platform super-admin check (the operator who provisions tenants and manages
 * seats). Allowlist-based via env `SUPER_ADMIN_EMAILS` (comma-separated) — no DB
 * flag, so it can't be escalated through the app. Used by the `/admin` section
 * (page-level guard) and `superAdminProcedure` (API guard).
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.toLowerCase());
}
