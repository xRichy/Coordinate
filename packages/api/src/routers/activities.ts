import { z } from "zod";
import { router, tenantProcedure } from "../trpc";

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Todo", "In Progress", "Done"]),
  dueDate: z.string(),
});

const taskRouter = router({
  list: tenantProcedure.output(z.array(taskSchema)).query(() => []),

  updateStatus: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["Todo", "In Progress", "Done"]),
      })
    )
    .output(z.object({ id: z.string() }))
    .mutation(({ input }) => ({ id: input.id })),
});

export const activitiesRouter = router({
  task: taskRouter,
});
