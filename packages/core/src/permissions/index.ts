import type { MemberRole } from "@coordinate/database";

export type Role = MemberRole;

/**
 * All permissions recognised by the platform core.
 * Modules declare their own permissions in their manifest and extend this
 * union as needed (e.g. `"crm:lead:write"`, `"warehouse:product:delete"`).
 */
export type Permission =
  // Tenant settings
  | "tenant:settings:read"
  | "tenant:settings:write"
  // Member management
  | "tenant:members:read"
  | "tenant:members:invite"
  | "tenant:members:remove"
  | "tenant:members:role:edit"
  // Billing
  | "tenant:billing:read"
  | "tenant:billing:write";

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: [
    "tenant:settings:read",
    "tenant:settings:write",
    "tenant:members:read",
    "tenant:members:invite",
    "tenant:members:remove",
    "tenant:members:role:edit",
    "tenant:billing:read",
    "tenant:billing:write",
  ],
  admin: [
    "tenant:settings:read",
    "tenant:settings:write",
    "tenant:members:read",
    "tenant:members:invite",
    "tenant:members:remove",
    "tenant:members:role:edit",
    "tenant:billing:read",
  ],
  member: [
    "tenant:settings:read",
    "tenant:members:read",
  ],
  viewer: [
    "tenant:settings:read",
    "tenant:members:read",
  ],
};

/** Returns true if `role` is granted `permission`. */
export function can(role: Role, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission);
}
