import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql:///",
  },
  migrations: {
    seed: "tsx src/bin/seed.ts",
  },
});
