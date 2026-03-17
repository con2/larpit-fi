import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    globalSetup: "./src/test/globalSetup.ts",
    env: {
      DATABASE_URL: "postgresql://japsu@localhost/larpit_test",
    },
  },
});
