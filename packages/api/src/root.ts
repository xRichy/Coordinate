import { router, publicProcedure } from "./trpc";
import { onboardingRouter } from "./routers/onboarding";
import { crmRouter } from "./routers/crm";
import { activitiesRouter } from "./routers/activities";
import { warehouseRouter } from "./routers/warehouse";
import { dashboardRouter } from "./routers/dashboard";
import { searchRouter } from "./routers/search";
import { notificationsRouter } from "./routers/notifications";
import { tenantRouter } from "./routers/tenant";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => ({ status: "ok" as const })),
  onboarding: onboardingRouter,
  crm: crmRouter,
  activities: activitiesRouter,
  warehouse: warehouseRouter,
  dashboard: dashboardRouter,
  search: searchRouter,
  notifications: notificationsRouter,
  tenant: tenantRouter,
});

export type AppRouter = typeof appRouter;
