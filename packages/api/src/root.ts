import { router, publicProcedure } from "./trpc";
import { onboardingRouter } from "./routers/onboarding";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => ({ status: "ok" as const })),
  onboarding: onboardingRouter,
});

export type AppRouter = typeof appRouter;
