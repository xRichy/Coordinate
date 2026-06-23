import { execSync } from "node:child_process";

/** Seed the deterministic E2E tenants/users before the suite runs. */
export default function globalSetup() {
  execSync("pnpm -F @coordinate/database db:seed:e2e", { stdio: "inherit" });
}
