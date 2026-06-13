// The calendar module has no models of its own: it renders activities (with a
// dueDate) from the activities module, consumed via activities.activity.* and
// crm.timeline.*. No dedicated tRPC sub-router is needed.
export const calendarModuleRouter = {} as const;
