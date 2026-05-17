import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    isolate: true,
    hookTimeout: 10_000,
    testTimeout: 10_000,
  },
});
