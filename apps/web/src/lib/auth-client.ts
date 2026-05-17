import { createAuthClient } from "better-auth/client";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";

// Use the current browser origin so that auth API calls stay same-origin even
// when the app is accessed from a tenant subdomain (e.g. demo.lvh.me:3000).
// Falls back to NEXT_PUBLIC_APP_URL for SSR and static pre-rendering.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    organizationClient(),
    twoFactorClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
