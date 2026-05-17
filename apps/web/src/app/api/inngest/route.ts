import { serve } from "inngest/next";
import { inngest, functions } from "@coordinate/core/jobs";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
