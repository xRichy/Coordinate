import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => ({ status: "ok" as const })),
});

export type AppRouter = typeof appRouter;
