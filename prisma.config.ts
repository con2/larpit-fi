import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const url = env("DATABASE_URL");

console.log({ url });

export default defineConfig({
  datasource: {
    url,
  },
  migrations: {
    seed: "tsx src/bin/seed.ts",
  },
});
