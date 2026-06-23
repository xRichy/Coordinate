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

  // Rate limiting on the auth endpoints. Better-Auth enables this in production
  // by default (in-memory store, 60s/100 req per IP); we keep that baseline and
  // tighten the sensitive endpoints to blunt credential/2FA brute-forcing.
  // Note: the in-memory counter is per serverless instance — adequate at this
  // scale; move to DB storage if abuse ever becomes a real concern.
  rateLimit: {
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/two-factor/verify-totp": { window: 60, max: 10 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
      "/two-factor/enable": { window: 60, max: 10 },
    },
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
