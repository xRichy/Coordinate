export { inngest } from "./client";
export { helloWorld } from "./hello-world";
export { purgeDeletedContacts } from "./purge-deleted-contacts";

import { helloWorld } from "./hello-world";
import { purgeDeletedContacts } from "./purge-deleted-contacts";

export const functions = [helloWorld, purgeDeletedContacts];
