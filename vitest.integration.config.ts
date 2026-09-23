import "dotenv/config";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // The test files share one database and truncate it between tests.
    fileParallelism: false,
    globalSetup: "./src/test/globalSetup.ts",
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
    },
  },
});
