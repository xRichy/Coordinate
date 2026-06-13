export { inngest } from "./client";
export { helloWorld } from "./hello-world";
export { purgeDeletedContacts } from "./purge-deleted-contacts";
export { activityReminders } from "./activity-reminders";

import { helloWorld } from "./hello-world";
import { purgeDeletedContacts } from "./purge-deleted-contacts";
import { activityReminders } from "./activity-reminders";

export const functions = [helloWorld, purgeDeletedContacts, activityReminders];
