import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "coordinate",
  isDev: process.env.NODE_ENV !== "production",
});
