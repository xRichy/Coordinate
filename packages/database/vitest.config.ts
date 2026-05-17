import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    envFiles: [".env"],
    // Each test file gets its own fresh context; avoids cross-test state leakage.
    isolate: true,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
