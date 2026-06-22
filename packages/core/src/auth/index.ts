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

  // No social/OAuth providers: in the boutique white-glove model the operator
  // provisions every account manually — clients never self-register, so social
  // login would only add an unused (and attackable) surface.

  plugins: [
    organization(),
    // TOTP-based 2FA. `issuer` is the label shown in the user's authenticator
    // app (Google Authenticator/Authy). Mandatory for Owners (enforced in the
    // tenant UI via <TwoFactorGate>), optional for everyone else.
    twoFactor({ issuer: "Coordinate" }),
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
