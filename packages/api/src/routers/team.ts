import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { MemberRole } from "@coordinate/database";
import { hashPassword, generateTempPassword } from "@coordinate/core/auth/password";
import { router, tenantProcedure } from "../trpc";
import { requirePermission } from "../middleware/permission";

/** Roles assignable to a member from the Team UI (owner is never assigned here). */
const assignableRole = z.enum([MemberRole.admin, MemberRole.member, MemberRole.viewer]);

export const teamRouter = router({
  /** Members of the current tenant + seat usage. */
  list: tenantProcedure
    .use(requirePermission("tenant:members:read"))
    .query(async ({ ctx }) => {
      const memberships = await ctx.db.membership.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          createdAt: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      });

      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: ctx.tenantId },
        select: { maxSeats: true },
      });

      return {
        members: memberships.map((m) => ({
          id: m.id,
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          createdAt: m.createdAt,
          isSelf: m.userId === ctx.session.user.id,
        })),
        seatsUsed: memberships.length,
        maxSeats: tenant.maxSeats,
      };
    }),

  /**
   * Create a new account tied to this tenant. Blocked when seats are full.
   * No email invite (Resend deferred): returns a temporary password to hand
   * over (generated if not provided).
   */
  createMember: tenantProcedure
    .use(requirePermission("tenant:members:invite"))
    .input(
      z.object({
        name: z.string().trim().min(1, "Nome obbligatorio").max(120),
        email: z.string().trim().toLowerCase().email("Email non valida"),
        role: assignableRole,
        password: z.string().min(8, "Almeno 8 caratteri").max(72).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.tenant.findUniqueOrThrow({
        where: { id: ctx.tenantId },
        select: { maxSeats: true },
      });
      const seatsUsed = await ctx.db.membership.count();
      if (seatsUsed >= tenant.maxSeats) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Limite di ${tenant.maxSeats} account raggiunto. Contattaci per aggiungere posti.`,
        });
      }

      // An email maps to one global account; refuse if it already exists so the
      // owner can't attach (or overwrite) someone else's account.
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Esiste già un account con questa email.",
        });
      }

      const generated = input.password ? null : generateTempPassword();
      const password = input.password ?? generated!;
      const hashed = await hashPassword(password);

      const user = await ctx.db.user.create({
        data: { name: input.name, email: input.email, emailVerified: true },
      });
      await ctx.db.account.create({
        data: {
          providerId: "credential",
          accountId: user.id,
          userId: user.id,
          password: hashed,
        },
      });
      await ctx.db.membership.create({
        data: { userId: user.id, tenantId: ctx.tenantId, role: input.role },
      });

      // Echo the password back only when we generated it (never re-echo a
      // password the owner typed).
      return { email: user.email, generatedPassword: generated };
    }),

  /** Change a member's role. The owner row and your own row are protected. */
  updateRole: tenantProcedure
    .use(requirePermission("tenant:members:role:edit"))
    .input(z.object({ membershipId: z.string(), role: assignableRole }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: { id: input.membershipId },
        select: { id: true, role: true, userId: true },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro non trovato." });
      }
      if (membership.role === MemberRole.owner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Non puoi modificare il ruolo dell'owner." });
      }
      if (membership.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Non puoi cambiare il tuo ruolo." });
      }

      await ctx.db.membership.update({
        where: { id: membership.id },
        data: { role: input.role },
      });
      return { ok: true };
    }),

  /** Remove a member (frees a seat). The owner and yourself cannot be removed. */
  removeMember: tenantProcedure
    .use(requirePermission("tenant:members:remove"))
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await ctx.db.membership.findUnique({
        where: { id: input.membershipId },
        select: { id: true, role: true, userId: true },
      });
      if (!membership) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membro non trovato." });
      }
      if (membership.role === MemberRole.owner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Non puoi rimuovere l'owner." });
      }
      if (membership.userId === ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Non puoi rimuovere te stesso." });
      }

      // Remove only the tenant membership; the user account stays (may belong to
      // other tenants) but loses access here via the membership check.
      await ctx.db.membership.delete({ where: { id: membership.id } });
      return { ok: true };
    }),
});
