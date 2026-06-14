import { hashPassword as baHashPassword } from "@better-auth/utils/password";
import { randomBytes } from "node:crypto";

/**
 * Hash a plaintext password in the Better-Auth credential format
 * (scrypt, `saltHex:keyHex`). Re-exported from Better-Auth's own utility so the
 * format stays in sync with the credential provider used at login — do not
 * reimplement the algorithm here.
 *
 * Used when creating a member account server-side (the owner sets/receives a
 * temporary password to hand over), mirroring the provisioning CLI.
 */
export function hashPassword(password: string): Promise<string> {
  return baHashPassword(password);
}

/**
 * Generate a readable temporary password to hand to a newly created member.
 * base64url → no ambiguous symbols, easy to dictate/copy. The member should
 * change it on first login.
 */
export function generateTempPassword(): string {
  return randomBytes(12).toString("base64url").slice(0, 14);
}
